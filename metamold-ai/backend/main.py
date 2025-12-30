"""
MetaMold AI Backend - Servidor de Processamento de Geometrias 3D

API para processamento de ficheiros CAD (STEP, STL, OBJ) e análise de geometrias.
Suporta múltiplos formatos de entrada e exporta modelos para visualização web (GLB).

Funcionalidades:
- Conversão de STEP para malha triangular
- Cálculo de propriedades geométricas (volume, área, dimensões)
- Exportação para formato GLB (binário, otimizado para web)
- Orçamentação automática de peças e moldes
"""

import base64
import io
import os
import tempfile
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, Dict, Any, List

import numpy as np
import trimesh
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Imports opcionais para processamento avançado de STEP
# O cadquery requer OCE/OpenCASCADE que pode não estar disponível em todos os ambientes
CADQUERY_AVAILABLE = False
try:
    import cadquery as cq
    CADQUERY_AVAILABLE = True
except ImportError:
    CADQUERY_AVAILABLE = False
    print("Aviso: cadquery não disponível. O processamento de STEP será feito com fallback.")


# ==============================================================================
# Modelos de Dados (Pydantic)
# ==============================================================================

class GeometryStats(BaseModel):
    """Estatísticas geométricas calculadas a partir do modelo 3D."""
    volume_cm3: float
    area_cm2: float
    dimensions: Dict[str, float]
    center_of_mass: List[float]
    bounding_box: Dict[str, List[float]]
    vertices_count: int
    faces_count: int
    is_watertight: bool
    is_manifold: bool


class BudgetRequest(BaseModel):
    """Parâmetros para cálculo de orçamento."""
    material: str
    finish: str
    quantity: int
    mold_base_config: Optional[Dict[str, Any]] = None
    cad_base_config: Optional[Dict[str, Any]] = None


class BudgetResponse(BaseModel):
    """Resultado do cálculo de orçamento."""
    total_price: float
    currency: str
    breakdown: Dict[str, Any]
    unit_price: float
    production_time_days: int


class AnalysisResponse(BaseModel):
    """Resposta completa da análise de geometria."""
    success: bool
    filename: str
    file_format: str
    geometry_type: str
    stats: GeometryStats
    mesh_data_base64: str  # Modelo GLB em base64 para visualização
    budget_options: Optional[List[Dict[str, Any]]] = None
    timestamp: str
    warnings: Optional[List[str]] = None


# ==============================================================================
# Configuração e Inicialização
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa os serviços na startup da aplicação."""
    print("=" * 60)
    print("Inicializando MetaMold AI Backend...")
    print("=" * 60)
    
    # Verificar disponibilidade do cadquery
    if CADQUERY_AVAILABLE:
        print("✓ CadQuery disponível - suporte completo para STEP")
    else:
        print("⚠ CadQuery não disponível - processamento de STEP com limitações")
    
    print("✓ Backend pronto para receber requisições")
    print("=" * 60)
    
    yield
    
    print("Encerrando serviços...")


app = FastAPI(
    title="MetaMold AI Backend",
    description="API para processamento de ficheiros CAD e análise de geometrias 3D",
    version="2.0.0",
    lifespan=lifespan
)

# Configuração de CORS para permitir acesso do frontend Streamlit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir aos domínios do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Funções de Processamento de Geometria
# ==============================================================================

def load_mesh_with_fallback(file_path: str, filename: str) -> trimesh.Trimesh:
    """
    Carrega um ficheiro 3D tentando múltiplas estratégias.
    
    Estratégias (por ordem de preferência):
    1. CadQuery (para STEP) - se disponível
    2. Trimesh nativo
    3. Trimesh com carregamento forçado
    
    Args:
        file_path: Caminho para o ficheiro temporário
        filename: Nome original do ficheiro (para deteção de formato)
    
    Returns:
        Objeto trimesh.Trimesh processado
    
    Raises:
        ValueError: Se o ficheiro não puder ser processado
    """
    file_ext = filename.lower().split('.')[-1]
    
    # Estratégia 1: CadQuery para ficheiros STEP
    if file_ext in ('step', 'stp'):
        if CADQUERY_AVAILABLE:
            try:
                print(f"Tentando carregar {filename} com CadQuery...")
                cq_object = cq.importers.importStep(file_path)
                
                # Converter para malha triangular
                mesh = trimesh.Trimesh(**trimesh.convex.convex_hull(cq_object.val().discrete()))
                
                # Se o objeto for mais complexo, usar tessellation
                if hasattr(cq_object, 'tessellate'):
                    result = cq_object.tessellate(0.1)  # Tolerância de 0.1mm
                    vertices = np.array(result[0])
                    faces = np.array(result[1])
                    
                    if len(vertices) > 0 and len(faces) > 0:
                        mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
                        print(f"✓ Carregado com CadQuery: {len(mesh.vertices)} vértices")
                        return mesh
                
                print("✓ Carregado com CadQuery (convex hull)")
                return mesh
                
            except Exception as e:
                print(f"⚠ CadQuery falhou: {e}")
        else:
            print("⚠ CadQuery não disponível, usando trimesh diretamente")
    
    # Estratégia 2: Trimesh nativo
    try:
        print(f"Tentando carregar {filename} com trimesh...")
        mesh = trimesh.load(file_path)
        
        if isinstance(mesh, trimesh.Trimesh):
            print(f"✓ Carregado com trimesh: {len(mesh.vertices)} vértices")
            return mesh
        elif isinstance(mesh, trimesh.Scene):
            # Se for uma cena (múltiplos objetos), combinar em única malha
            mesh = trimesh.util.concatenate(mesh.dump())
            print(f"✓ Cena combinada: {len(mesh.vertices)} vértices")
            return mesh
        else:
            raise ValueError(f"Tipo de objeto não suportado: {type(mesh)}")
            
    except Exception as e:
        print(f"⚠ Trimesh falhou: {e}")
    
    # Estratégia 3: Trimesh com carregamento forçado
    try:
        print(f"Tentando carregamento forçado de {filename}...")
        mesh = trimesh.load(file_path, force='mesh')
        print(f"✓ Carregamento forçado sucesso")
        return mesh
    except Exception as e:
        raise ValueError(f"Não foi possível processar o ficheiro: {e}")


def calculate_geometry_stats(mesh: trimesh.Trimesh) -> GeometryStats:
    """
    Calcula estatísticas geométricas detalhadas de uma malha triangular.
    
    Args:
        mesh: Objeto trimesh.Trimesh
    
    Returns:
        Objeto GeometryStats com todas as propriedades calculadas
    """
    # Calcular volume e área (convertidos para cm³ e cm²)
    volume = mesh.volume / 1000.0  # mm³ → cm³
    area = mesh.area / 100.0  # mm² → cm²
    
    # Dimensões da bounding box (convertidas para mm)
    bounds = mesh.bounds
    dimensions = {
        "width": float(bounds[1][0] - bounds[0][0]),
        "height": float(bounds[1][1] - bounds[0][1]),
        "depth": float(bounds[1][2] - bounds[0][2])
    }
    
    # Centro de massa
    center_of_mass = mesh.centroid.tolist()
    
    # Bounding box completa
    bounding_box = {
        "min": bounds[0].tolist(),
        "max": bounds[1].tolist()
    }
    
    return GeometryStats(
        volume_cm3=volume,
        area_cm2=area,
        dimensions=dimensions,
        center_of_mass=center_of_mass,
        bounding_box=bounding_box,
        vertices_count=len(mesh.vertices),
        faces_count=len(mesh.faces),
        is_watertight=mesh.is_watertight,
        is_manifold=mesh.is_watertight
    )


def export_mesh_to_glb(mesh: trimesh.Trimesh) -> str:
    """
    Exporta uma malha triangular para formato GLB (base64).
    
    O formato GLB é binário e otimizado para transmissão web,
    suportado pela maioria dos navegadores e bibliotecas 3D.
    
    Args:
        mesh: Objeto trimesh.Trimesh
    
    Returns:
        String base64 contendo o ficheiro GLB
    """
    # Criar buffer de memória para o ficheiro GLB
    buffer = io.BytesIO()
    
    # Exportar para GLB (formato binário do glTF)
    mesh.export(file_obj=buffer, file_type='glb')
    
    # Converter para base64
    buffer.seek(0)
    glb_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    
    return glb_base64


def calculate_budget_from_stats(
    stats: GeometryStats,
    material: str,
    finish: str,
    quantity: int
) -> Dict[str, Any]:
    """
    Calcula orçamento de fabrico baseado nas estatísticas geométricas.
    
    Args:
        stats: Estatísticas geométricas da peça
        material: Tipo de material selecionado
        finish: Tipo de acabamento superficial
        quantity: Quantidade a produzir
    
    Returns:
        Dicionário com detalhamento de custos
    """
    # Configurações de materiais (preço por cm³)
    materials = {
        "H13": {"price": 0.85, "name": "Aço H13", "hardness": "48-52 HRC"},
        "P20": {"price": 0.65, "name": "Aço P20", "hardness": "28-32 HRC"},
        "718": {"price": 0.75, "name": "Aço 718", "hardness": "32-38 HRC"},
        "ALUMINUM": {"price": 0.45, "name": "Alumínio 7075", "hardness": "60-65 HB"},
        "S7": {"price": 0.70, "name": "Aço S7", "hardness": "54-58 HRC"}
    }
    
    # Configurações de acabamentos (multiplicador de preço)
    finishes = {
        "machined": {"multiplier": 1.0, "name": "Maquinado"},
        "ground": {"multiplier": 1.3, "name": "Retificado"},
        "polished": {"multiplier": 1.5, "name": "Polido"},
        "textured": {"multiplier": 1.8, "name": "Texturizado"},
        "edm": {"multiplier": 2.2, "name": "Eletroerosão (EDM)"}
    }
    
    # Obter configurações
    mat_config = materials.get(material, materials["P20"])
    fin_config = finishes.get(finish, finishes["machined"])
    
    # Calcular custos base
    material_cost = stats.volume_cm3 * mat_config["price"]
    finish_cost = material_cost * (fin_config["multiplier"] - 1.0)
    
    # Custos de configuração (fixos)
    setup_fee = 500.0  # Taxa de setup base
    
    # Desconto por quantidade
    quantity_discount = 1.0
    if quantity >= 100:
        quantity_discount = 0.85
    elif quantity >= 50:
        quantity_discount = 0.90
    elif quantity >= 10:
        quantity_discount = 0.95
    
    # Custo base da peça
    piece_cost = (material_cost + finish_cost + setup_fee) * quantity_discount
    
    # Custo total
    total = piece_cost * quantity
    
    # Tempo de produção estimado (dias)
    production_time = max(5, int(quantity / 10) + 3)
    
    return {
        "unit_price": round(piece_cost, 2),
        "total_price": round(total, 2),
        "currency": "EUR",
        "material": mat_config["name"],
        "hardness": mat_config["hardness"],
        "finish": fin_config["name"],
        "setup_fee": round(setup_fee * quantity_discount, 2),
        "material_cost": round(material_cost * quantity_discount, 2),
        "finish_cost": round(finish_cost * quantity_discount, 2),
        "quantity_discount": f"{int((1 - quantity_discount) * 100)}%",
        "production_time_days": production_time,
        "volume_cm3": round(stats.volume_cm3, 2),
        "area_cm2": round(stats.area_cm2, 2)
    }


# ==============================================================================
# Endpoints da API
# ==============================================================================

@app.get("/")
async def root():
    """Endpoint de verificação de estado."""
    return {
        "status": "online",
        "service": "MetaMold AI Backend",
        "version": "2.0.0",
        "cadquery_available": CADQUERY_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Verificação detalhada de saúde dos serviços."""
    return {
        "status": "healthy",
        "services": {
            "cadquery": CADQUERY_AVAILABLE,
            "trimesh": True,
            "geometry_analysis": True,
            "budget_calculator": True
        }
    }


@app.get("/info")
async def get_server_info():
    """Retorna informações sobre capacidades do servidor."""
    return {
        "supported_formats": ["step", "stp", "stl", "obj", "ply", "glb"],
        "max_file_size_mb": 100,
        "cadquery_support": CADQUERY_AVAILABLE,
        "features": [
            "geometry_analysis",
            "volume_calculation",
            "area_calculation",
            "bounding_box",
            "center_of_mass",
            "glb_export",
            "budget_estimation"
        ]
    }


@app.post("/analyze/", response_model=AnalysisResponse)
async def analyze_geometry(
    file: UploadFile = File(...),
    material: str = "P20",
    finish: str = "machined",
    quantity: int = 1
):
    """
    Endpoint principal para análise de geometria 3D.
    
    Processa um ficheiro 3D, calcula propriedades geométricas,
    exporta para GLB e retorna todos os dados necessários para
    renderização no frontend e orçamentação.
    
    Args:
        file: Ficheiro 3D (STEP, STL, OBJ, etc.)
        material: Material para orçamentação (default: P20)
        finish: Acabamento para orçamentação (default: machined)
        quantity: Quantidade para orçamentação (default: 1)
    
    Returns:
        AnalysisResponse com estatísticas, modelo GLB e orçamento
    """
    warnings = []
    temp_path = None
    
    try:
        # Validar extensão do ficheiro
        filename = file.filename.lower()
        supported_extensions = ['.step', '.stp', '.stl', '.obj', '.ply', '.glb']
        
        if not any(filename.endswith(ext) for ext in supported_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Formato não suportado. Formatos aceitos: {', '.join(supported_extensions)}"
            )
        
        # Criar ficheiro temporário
        file_id = str(uuid.uuid4())
        temp_path = f"/tmp/{file_id}_{file.filename}"
        
        # Escrever ficheiro uploaded
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        print(f"Processando ficheiro: {file.filename} ({len(content)} bytes)")
        
        # Carregar e processar geometria
        mesh = load_mesh_with_fallback(temp_path, file.filename)
        
        if mesh is None or len(mesh.vertices) == 0:
            raise ValueError("Não foi possível extrair geometria válida do ficheiro")
        
        # Verificar qualidade da malha
        if not mesh.is_watertight:
            warnings.append("A geometria não é estanque (pode afetar volume)")
        if not mesh.is_watertight:
            warnings.append("A geometria pode não ser manifold (bordas duplicadas)")
        
        # Calcular estatísticas
        stats = calculate_geometry_stats(mesh)
        
        print(f"✓ Geometria processada: V={stats.vertices_count}, F={stats.faces_count}")
        
        # Exportar para GLB
        glb_base64 = export_mesh_to_glb(mesh)
        print(f"✓ Exportado para GLB: {len(glb_base64)} bytes (base64)")
        
        # Calcular orçamento
        budget = calculate_budget_from_stats(stats, material, finish, quantity)
        
        # Preparar resposta
        response = AnalysisResponse(
            success=True,
            filename=file.filename,
            file_format=filename.split('.')[-1],
            geometry_type="triangular_mesh",
            stats=stats,
            mesh_data_base64=glb_base64,
            budget_options=[budget],
            timestamp=datetime.now().isoformat(),
            warnings=warnings if warnings else None
        )
        
        return response
        
    except HTTPException:
        raise
        
    except Exception as e:
        print(f"Erro ao processar ficheiro: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar ficheiro: {str(e)}"
        )
        
    finally:
        # Limpar ficheiro temporário
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.post("/budget/calculate")
async def calculate_budget(
    stats: GeometryStats,
    material: str = "P20",
    finish: str = "machined",
    quantity: int = 1
):
    """
    Calcula orçamento baseado em estatísticas geométricas existentes.
    
    Útil quando o modelo já foi processado anteriormente e apenas
    se quer recalcular o orçamento com diferentes parâmetros.
    
    Args:
        stats: Estatísticas geométricas da peça
        material: Material para orçamentação
        finish: Acabamento para orçamentação
        quantity: Quantidade a produzir
    
    Returns:
        Detalhamento de custos e orçamento final
    """
    try:
        budget = calculate_budget_from_stats(stats, material, finish, quantity)
        
        return {
            "success": True,
            "budget": budget,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao calcular orçamento: {str(e)}"
        )


@app.get("/materials")
async def get_materials():
    """Retorna lista de materiais disponíveis com preços."""
    return {
        "materials": [
            {"id": "H13", "name": "Aço H13", "price_per_cm3": 0.85, "hardness": "48-52 HRC"},
            {"id": "P20", "name": "Aço P20", "price_per_cm3": 0.65, "hardness": "28-32 HRC"},
            {"id": "718", "name": "Aço 718", "price_per_cm3": 0.75, "hardness": "32-38 HRC"},
            {"id": "ALUMINUM", "name": "Alumínio 7075", "price_per_cm3": 0.45, "hardness": "60-65 HB"},
            {"id": "S7", "name": "Aço S7", "price_per_cm3": 0.70, "hardness": "54-58 HRC"}
        ]
    }


@app.get("/finishes")
async def get_finishes():
    """Retorna lista de acabamentos disponíveis."""
    return {
        "finishes": [
            {"id": "machined", "name": "Maquinado", "multiplier": 1.0, "description": "Acabamento padrão de maquinação"},
            {"id": "ground", "name": "Retificado", "multiplier": 1.3, "description": "Superfície retificada de precisão"},
            {"id": "polished", "name": "Polido", "multiplier": 1.5, "description": "Polimento espelhado"},
            {"id": "textured", "name": "Texturizado", "multiplier": 1.8, "description": "Textura decorativa por ataque químico"},
            {"id": "edm", "name": "Eletroerosão (EDM)", "multiplier": 2.2, "description": "Acabamento por eletroerosão"}
        ]
    }


# ==============================================================================
# Execução do Servidor
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Configuração do servidor
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"Iniciando servidor em {host}:{port}")
    uvicorn.run(app, host=host, port=port, reload=debug)
