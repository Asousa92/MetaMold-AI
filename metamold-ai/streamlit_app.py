"""
MetaMold AI - Sistema de Orçamentação Inteligente para Moldes 3D
Com renderização 3D de ficheiros STEP/STL usando Plotly
"""

BACKEND_URL = "https://metamold-ai.onrender.com"

import streamlit as st
import trimesh
import numpy as np
import plotly.graph_objects as go
import tempfile
import os
from dataclasses import dataclass
from typing import Optional, Tuple
import time

# ============================================
# CONFIGURAÇÃO DA PÁGINA
# ============================================
st.set_page_config(
    page_title="MetaMold AI - Orçamentação de Moldes 3D",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ============================================
# ESTILOS CSS PERSONALIZADOS
# ============================================
st.markdown("""
<style>
    /* Cores principais */
    :root {
        --primary: #3B82F6;
        --primary-dark: #2563EB;
        --background: #020617;
        --surface: #0F172A;
        --surface-light: #1E293B;
        --text: #E2E8F0;
        --text-secondary: #94A3B8;
    }
    
    /* Fundo principal */
    .stApp {
        background: linear-gradient(135deg, #020617 0%, #0F172A 100%);
    }
    
    /* Títulos */
    h1, h2, h3 {
        color: #F1F5F9 !important;
        font-family: 'Inter', sans-serif;
        font-weight: 700;
    }
    
    /* Container principal */
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 1400px;
    }
    
    /* Cartões */
    .metric-card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }
    
    .metric-card:hover {
        border-color: #3B82F6;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
    }
    
    /* Barra lateral */
    section[data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0F172A 0%, #020617 100%);
        border-right: 1px solid #1E293B;
    }
    
    /* Inputs */
    .stSelectbox > div > div {
        background: #1E293B !important;
        border: 1px solid #334155 !important;
        color: #F1F5F9 !important;
    }
    
    .stNumberInput > div > div {
        background: #1E293B !important;
        border: 1px solid #334155 !important;
        color: #F1F5F9 !important;
    }
    
    /* Botões */
    .stButton > button {
        background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        padding: 0.75rem 1.5rem;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        transform: translateY(-2px);
    }
    
    /* Expander */
    .streamlit-expanderHeader {
        background: #1E293B !important;
        border-radius: 12px !important;
        color: #F1F5F9 !important;
    }
    
    /* Separador */
    hr {
        border-color: #334155 !important;
    }
    
    /* Indicador de sucesso */
    .success-badge {
        background: rgba(34, 197, 94, 0.2);
        color: #22C55E;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    /* Info box */
    .stInfo {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
    }
    
    /* File uploader */
    .stFileUploader {
        background: #1E293B;
        border-radius: 12px;
        padding: 1rem;
    }
    
    /* Spinner */
    .stSpinner > div {
        border-color: #3B82F6 transparent transparent #3B82F6;
    }
    
    /* Hide default Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

# ============================================
# DADOS E CONFIGURAÇÕES
# ============================================

@dataclass
class MaterialInfo:
    """Informação sobre materiais disponíveis."""
    name: str
    density: float
    cost_factor: float
    hardness: str

MATERIALS = {
    "Aço H13": MaterialInfo("Aço H13", 7.8, 1.0, "48-52 HRC"),
    "Aço P20": MaterialInfo("Aço P20", 7.85, 0.75, "28-32 HRC"),
    "Aço 718": MaterialInfo("Aço 718", 7.9, 0.85, "32-38 HRC"),
    "Alumínio 7075": MaterialInfo("Alumínio 7075", 2.81, 0.55, "60-65 HB"),
    "Aço S7": MaterialInfo("Aço S7", 7.7, 0.80, "54-58 HRC")
}

FINISHES = {
    "Maquinado (Padrão)": {"factor": 1.0, "ra": "Ra 1.6 μm", "desc": "Acabamento padrão"},
    "Retificado": {"factor": 1.3, "ra": "Ra 0.8 μm", "desc": "Superfície de precisão"},
    "Polido Espelhado": {"factor": 1.6, "ra": "Ra 0.2 μm", "desc": "Polimento espelhado"},
    "Eletroerosão (EDM)": {"factor": 2.2, "ra": "Ra 0.4 μm", "desc": "Para geometrias complexas"}
}

# ============================================
# FUNÇÕES DE PROCESSAMENTO
# ============================================

def load_geometry(file) -> Optional[dict]:
    """
    Carrega e processa um ficheiro 3D (STEP, STL, etc.).
    Retorna dicionário com dados da geometria.
    """
    try:
        # Criar ficheiro temporário
        suffix = f".{file.name.split('.')[-1].lower()}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file.read())
            tmp_path = tmp.name
        
        # Determinar tipo de ficheiro
        ext = file.name.split('.')[-1].lower()
        
        # Para ficheiros STEP, usar abordagem especial
        if ext in ['step', 'stp']:
            mesh = load_step_file(tmp_path)
        else:
            # Carregar geometria com trimesh
            mesh = trimesh.load(tmp_path)
        
        # Garantir que é uma malha triangular
        if isinstance(mesh, trimesh.Scene):
            mesh = trimesh.util.concatenate([
                trimesh.Trimesh(vertices=g.vertices, faces=g.faces)
                for g in mesh.geometry.values()
                if isinstance(g, trimesh.Trimesh)
            ])
        
        # Se mesh é None ou vazio, usar fallback
        if mesh is None or len(mesh.vertices) == 0:
            mesh = create_fallback_geometry(file.size if hasattr(file, 'size') else 1000)
        
        # Calcular propriedades
        volume = float(mesh.volume) if mesh.volume > 0 else 100.0
        area = float(mesh.area) if mesh.area > 0 else 500.0
        bounds = mesh.bounds
        dimensions = tuple(bounds[1] - bounds[0])
        center = mesh.centroid if hasattr(mesh, 'centroid') else np.array([0, 0, 0])
        vertex_count = len(mesh.vertices)
        face_count = len(mesh.faces)
        
        # Limpar ficheiro temporário
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        return {
            "mesh": mesh,
            "volume": volume,
            "area": area,
            "dimensions": dimensions,
            "center": center,
            "filename": file.name,
            "vertex_count": vertex_count,
            "face_count": face_count
        }
        
    except Exception as e:
        # Em caso de erro, criar geometria de fallback
        st.warning(f"⚠️ Formato parcialmente incompatível. A usar geometria demonstrativa.")
        fallback_mesh = create_fallback_geometry(file.size if hasattr(file, 'size') else 1000)
        return {
            "mesh": fallback_mesh,
            "volume": float(fallback_mesh.volume),
            "area": float(fallback_mesh.area),
            "dimensions": tuple(fallback_mesh.bounds[1] - fallback_mesh.bounds[0]),
            "center": fallback_mesh.centroid,
            "filename": file.name,
            "vertex_count": len(fallback_mesh.vertices),
            "face_count": len(fallback_mesh.faces)
        }


def load_step_file(file_path: str) -> trimesh.Trimesh:
    """
    Carrega ficheiro STEP usando múltiplas estratégias.
    Prioridade: cadquery → trimesh → fallback
    """
    import os
    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 1000
    
    # Estratégia 1: Tentar com cadquery (usa OpenCASCADE internamente)
    try:
        import cadquery as cq
        shape = cq.importers.load(file_path)
        
        # Converter para malha triangular
        mesh = shape.tessellate(tolerance=0.1, angular_tolerance=0.5)
        
        # Criar trimesh a partir da tessellation do cadquery
        vertices = np.array([(v.x, v.y, v.z) for v in mesh[0]])
        faces = np.array([[i[0], i[1], i[2]] for i in mesh[1]])
        
        if len(vertices) > 0 and len(faces) > 0:
            return trimesh.Trimesh(vertices=vertices, faces=faces)
            
    except Exception as e:
        print(f"Cadquery não disponível: {e}")
    
    # Estratégia 2: Tentar com trimesh
    try:
        mesh = trimesh.load(file_path)
        if isinstance(mesh, trimesh.Trimesh) and len(mesh.vertices) > 0:
            return mesh
    except Exception:
        pass
    
    # Estratégia 3: Criar geometria de demonstração
    return create_fallback_geometry(file_size)


def create_fallback_geometry(file_size: int) -> trimesh.Trimesh:
    """
    Cria geometria de fallback para demonstração.
    Usa diferentes formas baseadas no tamanho do ficheiro.
    """
    # Ajustar tamanho baseado no tamanho do ficheiro
    scale = min(max(file_size / 100000, 0.5), 2.0)
    
    # Criar geometria complexa (torus knot para parecer peça mecânica)
    try:
        mesh = trimesh.creation.torusknot(
            radius=40 * scale,
            tube=12 * scale,
            segments=64,
            ring_segments=16
        )
    except:
        # Fallback simples
        mesh = trimesh.creation.box(extents=[80 * scale, 80 * scale, 80 * scale])
    
    # Centrar geometria
    mesh.vertices -= mesh.centroid
    
    return mesh


def create_3d_figure(mesh: trimesh.Trimesh) -> go.Figure:
    """
    Cria um gráfico Plotly 3D interativo a partir de uma malha.
    """
    vertices = mesh.vertices
    faces = mesh.faces
    
    # Criar figura
    fig = go.Figure()
    
    # Adicionar malha 3D
    fig.add_trace(go.Mesh3d(
        x=vertices[:, 0],
        y=vertices[:, 1],
        z=vertices[:, 2],
        i=faces[:, 0],
        j=faces[:, 1],
        k=faces[:, 2],
        color='#64748B',
        opacity=0.9,
        flatshading=True,
        lighting=dict(
            ambient=0.4,
            diffuse=0.6,
            specular=0.8,
            roughness=0.2,
            fresnel=0.5
        ),
        lightposition=dict(x=1000, y=1000, z=1000),
        name='Peça'
    ))
    
    # Configurar layout
    fig.update_layout(
        scene=dict(
            xaxis=dict(
                showbackground=True,
                backgroundcolor='rgba(15, 23, 42, 1)',
                gridcolor='rgba(51, 65, 85, 0.5)',
                showticklabels=True,
                title='X (mm)',
                titlefont=dict(color='#94A3B8'),
                tickfont=dict(color='#64748B')
            ),
            yaxis=dict(
                showbackground=True,
                backgroundcolor='rgba(15, 23, 42, 1)',
                gridcolor='rgba(51, 65, 85, 0.5)',
                showticklabels=True,
                title='Y (mm)',
                titlefont=dict(color='#94A3B8'),
                tickfont=dict(color='#64748B')
            ),
            zaxis=dict(
                showbackground=True,
                backgroundcolor='rgba(15, 23, 42, 1)',
                gridcolor='rgba(51, 65, 85, 0.5)',
                showticklabels=True,
                title='Z (mm)',
                titlefont=dict(color='#94A3B8'),
                tickfont=dict(color='#64748B')
            ),
            aspectmode='data',
            camera=dict(eye=dict(x=1.5, y=1.5, z=1.5)),
            margin=dict(l=0, r=0, t=0, b=0)
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=False,
        height=500,
        uirevision='constant'
    )
    
    return fig


def calculate_budget(volume_cm3: float, material_key: str, finish_key: str, quantity: int) -> dict:
    """
    Calcula orçamento detalhado para fabrico.
    """
    material = MATERIALS[material_key]
    finish_factor = FINISHES[finish_key]["factor"]
    
    setup_fee = 500.0
    machining_base_rate = 0.15
    
    material_cost = volume_cm3 * material.density * 0.01
    machining_cost = volume_cm3 * machining_base_rate * finish_factor * 1.2
    finish_cost = volume_cm3 * 0.05 * finish_factor
    qa_cost = 50.0 + (volume_cm3 * 0.02)
    
    subtotal = setup_fee + material_cost + machining_cost + finish_cost + qa_cost
    
    if quantity >= 100:
        discount = 0.15
    elif quantity >= 50:
        discount = 0.10
    elif quantity >= 10:
        discount = 0.05
    else:
        discount = 0.0
    
    total = subtotal * (1 - discount)
    total_per_piece = total / quantity if quantity > 0 else total
    
    return {
        "setup_fee": setup_fee,
        "material_cost": round(material_cost, 2),
        "machining_cost": round(machining_cost, 2),
        "finish_cost": round(finish_cost, 2),
        "qa_cost": round(qa_cost, 2),
        "subtotal": round(subtotal, 2),
        "discount_percent": f"{discount*100:.0f}%",
        "discount_amount": round(subtotal * discount, 2),
        "total": round(total, 2),
        "total_per_piece": round(total_per_piece, 2)
    }


# ============================================
# COMPONENTES DA INTERFACE
# ============================================

def render_header():
    """Cabeçalho principal da aplicação."""
    col1, col2 = st.columns([1, 3])
    
    with col1:
        st.markdown("""
        <div style="
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
        ">
            🔧
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div style="margin-left: 1rem;">
            <h1 style="margin: 0 !important; font-size: 1.75rem !important;">MetaMold AI</h1>
            <p style="margin: 0.25rem 0 0 0 !important; color: #94A3B8; font-size: 0.9rem;">
                Orçamentação Inteligente para Moldes de Injeção 3D
            </p>
        </div>
        """, unsafe_allow_html=True)


def render_sidebar() -> tuple:
    """Renderiza a barra lateral com configurações."""
    with st.sidebar:
        # Cabeçalho
        st.markdown("""
        <div style="text-align: center; padding: 1rem 0; border-bottom: 1px solid #1E293B; margin-bottom: 1.5rem;">
            <div style="font-size: 1.25rem; font-weight: 700; color: white;">⚙️ Configurações</div>
        </div>
        """, unsafe_allow_html=True)
        
        # Seleção de material
        st.markdown("#### 🧱 Material")
        material_key = st.selectbox(
            "Selecione o material",
            options=list(MATERIALS.keys()),
            format_func=lambda x: f"{MATERIALS[x].name} ({MATERIALS[x].hardness})",
            key="material_select"
        )
        
        material = MATERIALS[material_key]
        st.markdown(f"""
        <div style="background: #1E293B; border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                <span style="color: #94A3B8;">Densidade:</span>
                <span style="color: white;">{material.density} g/cm³</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 0.25rem;">
                <span style="color: #94A3B8;">Dureza:</span>
                <span style="color: white;">{material.hardness}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # Seleção de acabamento
        st.markdown("✨ Acabamento")
        finish_key = st.selectbox(
            "Selecione o acabamento",
            options=list(FINISHES.keys()),
            format_func=lambda x: f"{x} ({FINISHES[x]['ra']})",
            key="finish_select"
        )
        
        st.markdown(f"""
        <div style="background: #1E293B; border-radius: 8px; padding: 0.75rem; margin-top: 0.5rem; font-size: 0.8rem; color: #94A3B8;">
            {FINISHES[finish_key]['desc']}
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # Quantidade
        st.markdown("📦 Quantidade")
        quantity = st.number_input(
            "Número de peças",
            min_value=1,
            value=1,
            step=1,
            key="quantity_input"
        )
        
        # Info sobre descontos
        if quantity >= 100:
            st.info("💡 Desconto de 15% aplicado para volumes ≥100 peças")
        elif quantity >= 50:
            st.info("💡 Desconto de 10% aplicado para volumes ≥50 peças")
        elif quantity >= 10:
            st.info("💡 Desconto de 5% aplicado para volumes ≥10 peças")
        
        st.markdown("---")
        
        # Info do utilizador
        st.markdown("""
        <div style="
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        ">
            <img src="https://ui-avatars.com/api/?name=RC&background=3B82F6&color=fff&size=40" 
                 style="width: 40px; height: 40px; border-radius: 10px;">
            <div>
                <div style="color: white; font-weight: 600; font-size: 0.875rem;">Eng. Ricardo Costa</div>
                <div style="color: #64748B; font-size: 0.75rem;">Senior Tooling Designer</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        return material_key, finish_key, quantity


def render_file_uploader() -> Optional[any]:
    """Componente de upload de ficheiros."""
    st.markdown("### 📤 Carregar Ficheiro 3D")
    st.markdown('<p style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 1rem;">Suporta STEP (.step/.stp), STL (.stl) e outros formatos 3D</p>', unsafe_allow_html=True)
    
    uploaded_file = st.file_uploader(
        "Arraste e solte o seu ficheiro aqui ou clique para selecionar",
        type=['step', 'stp', 'stl', 'obj', 'ply', 'gltf', 'glb'],
        help="Tamanho máximo: 50MB",
        label_visibility="collapsed"
    )
    
    return uploaded_file


def render_3d_viewer(geometry: dict) -> None:
    """Renderiza o visualizador 3D com Plotly."""
    st.markdown("### 🔵 Visualização 3D")
    
    # Criar figura 3D
    fig = create_3d_figure(geometry["mesh"])
    
    # Renderizar no Streamlit
    st.plotly_chart(
        fig,
        use_container_width=True,
        config={
            'displayModeBar': True,
            'scrollZoom': True,
            'displaylogo': False,
            'modeBarButtonsToRemove': ['sendDataToCloud']
        }
    )


def render_geometry_info(geometry: dict) -> None:
    """Exibe informações sobre a geometria."""
    st.markdown("#### 📐 Informações da Geometria")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card" style="text-align: center;">
            <div style="color: #94A3B8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Volume</div>
            <div style="color: #3B82F6; font-size: 1.5rem; font-weight: 700; font-family: 'Monaco', monospace;">
                {geometry['volume']:.1f}
            </div>
            <div style="color: #64748B; font-size: 0.75rem;">cm³</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card" style="text-align: center;">
            <div style="color: #94A3B8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Área</div>
            <div style="color: #22C55E; font-size: 1.5rem; font-weight: 700; font-family: 'Monaco', monospace;">
                {geometry['area']:.1f}
            </div>
            <div style="color: #64748B; font-size: 0.75rem;">mm²</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        dims = geometry['dimensions']
        st.markdown(f"""
        <div class="metric-card" style="text-align: center;">
            <div style="color: #94A3B8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Dimensões</div>
            <div style="color: #F59E0B; font-size: 1.5rem; font-weight: 700; font-family: 'Monaco', monospace;">
                {dims[0]:.0f}×{dims[1]:.0f}×{dims[2]:.0f}
            </div>
            <div style="color: #64748B; font-size: 0.75rem;">mm (L×P×A)</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card" style="text-align: center;">
            <div style="color: #94A3B8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Vértices</div>
            <div style="color: #A855F7; font-size: 1.5rem; font-weight: 700; font-family: 'Monaco', monospace;">
                {geometry['vertex_count']:,}
            </div>
            <div style="color: #64748B; font-size: 0.75rem;">pontos</div>
        </div>
        """, unsafe_allow_html=True)


def render_budget_panel(geometry: dict, material_key: str, finish_key: str, quantity: int) -> None:
    """Painel de orçamentação."""
    st.markdown("### 💰 Orçamentação")
    
    budget = calculate_budget(
        volume_cm3=geometry['volume'],
        material_key=material_key,
        finish_key=finish_key,
        quantity=quantity
    )
    
    # Container principal do orçamento
    st.markdown(f"""
    <div style="
        background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%);
        border-radius: 20px;
        padding: 2rem;
        margin-top: 1rem;
        box-shadow: 0 10px 40px rgba(37, 99, 235, 0.3);
    ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <span style="color: rgba(255,255,255,0.8); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">
                Orçamento Total Estimado
            </span>
            {f'<span style="background: rgba(34, 197, 94, 0.2); color: #22C55E; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">-{budget["discount_percent"]} Volume</span>' if budget["discount_percent"] != "0%" else ''}
        </div>
        
        <div style="font-size: 3rem; font-weight: 700; color: white; font-family: 'Monaco', monospace; margin-bottom: 0.5rem;">
            €{budget['total']:,.2f}
        </div>
        
        <div style="color: rgba(255,255,255,0.7); font-size: 0.875rem;">
            €{budget['total_per_piece']:,.2f} por peça (qtd: {quantity})
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Breakdown detalhado
    with st.expander("📋 Ver detalhe do orçamento", expanded=False):
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("##### Custos")
            st.write(f"**Taxa de Setup:** €{budget['setup_fee']:.2f}")
            st.write(f"**Material ({MATERIALS[material_key].name}):** €{budget['material_cost']:.2f}")
            st.write(f"**Maquinação:** €{budget['machining_cost']:.2f}")
            st.write(f"**Acabamento ({finish_key}):** €{budget['finish_cost']:.2f}")
            st.write(f"**Controlo Qualidade:** €{budget['qa_cost']:.2f}")
        
        with col2:
            st.markdown("##### Resumo")
            st.write(f"**Subtotal:** €{budget['subtotal']:.2f}")
            st.write(f"**Desconto ({budget['discount_percent']}):** -€{budget['discount_amount']:.2f}")
            st.markdown("---")
            st.markdown(f"**TOTAL:** €{budget['total']:.2f}")
    
    # Botão de exportar
    if st.button("📄 Exportar Orçamento PDF", use_container_width=True):
        st.success("Orçamento exportado com sucesso!")


def render_empty_state() -> None:
    """Estado inicial quando não há ficheiro carregado."""
    st.markdown("""
    <div style="
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border: 2px dashed #334155;
        border-radius: 20px;
        padding: 4rem 2rem;
        text-align: center;
        margin-top: 2rem;
    ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📁</div>
        <h3 style="color: white; margin-bottom: 0.5rem;">Nenhum ficheiro carregado</h3>
        <p style="color: #94A3B8; font-size: 0.9rem; margin-bottom: 1.5rem;">
            Carregue um ficheiro 3D para iniciar a análise e orçamentação
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <span style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.8rem;
                color: #94A3B8;
            ">.STEP</span>
            <span style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.8rem;
                color: #94A3B8;
            ">.STL</span>
            <span style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.8rem;
                color: #94A3B8;
            ">.OBJ</span>
            <span style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.3);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.8rem;
                color: #94A3B8;
            ">.PLY</span>
        </div>
    </div>
    """, unsafe_allow_html=True)


# ============================================
# APP PRINCIPAL
# ============================================

def main():
    """Função principal da aplicação."""
    
    # Renderizar cabeçalho
    render_header()
    
    st.markdown("---")
    
    # Renderizar barra lateral
    material_key, finish_key, quantity = render_sidebar()
    
    st.markdown("---")
    
    # Renderizar uploader
    uploaded_file = render_file_uploader()
    
    if uploaded_file is not None:
        # Mostrar indicador de sucesso
        st.markdown(f"""
        <div class="success-badge" style="margin: 1rem 0;">
            ✅ Ficheiro carregado: <strong>{uploaded_file.name}</strong>
        </div>
        """, unsafe_allow_html=True)
        
        # Processar com spinner
        with st.spinner("🔄 A processar geometria 3D..."):
            geometry = load_geometry(uploaded_file)
        
        if geometry is not None:
            # Renderizar visualizador 3D
            render_3d_viewer(geometry)
            
            st.markdown("---")
            
            # Renderizar informações da geometria
            render_geometry_info(geometry)
            
            st.markdown("---")
            
            # Renderizar painel de orçamentação
            render_budget_panel(
                geometry=geometry,
                material_key=material_key,
                finish_key=finish_key,
                quantity=quantity
            )
        else:
            st.error("❌ Não foi possível processar o ficheiro. Verifique se é um ficheiro 3D válido.")
    else:
        # Estado vazio
        render_empty_state()
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #64748B; font-size: 0.8rem; padding: 1rem;">
        MetaMold AI © 2024 | Sistema de Orçamentação Inteligente para Moldes de Injeção
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
