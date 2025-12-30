"""
Serviço de análise de geometrias 3D.
Calcula estatísticas e propriedades físicas de malhas triangulares.
"""

import numpy as np
import trimesh
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class GeometryStats:
    """Estatísticas detalhadas de geometria."""
    volume: float
    area: float
    dimensions: Dict[str, float]
    center_of_mass: List[float]
    inertia_tensor: List[List[float]]
    bounding_box: Dict[str, List[float]]
    mesh_info: Dict[str, any]
    complexity_metrics: Dict[str, float]

class GeometryAnalyzer:
    """
    Analisador de geometrias 3D para aplicações de moldes.
    """
    
    def __init__(self):
        self.initialized = True
    
    def analyze(self, mesh: trimesh.Trimesh) -> Dict:
        """
        Analisa uma geometria e retorna estatísticas completas.
        
        Args:
            mesh: Objeto trimesh para análise
            
        Returns:
            Dicionário com todas as estatísticas
        """
        try:
            # Estatísticas básicas
            volume = float(mesh.volume) if mesh.is_watertight else 0.0
            area = float(mesh.area)
            
            # Dimensões
            bounds = mesh.bounds
            dimensions = {
                "width": float(bounds[1][0] - bounds[0][0]),
                "height": float(bounds[1][1] - bounds[0][1]),
                "depth": float(bounds[1][2] - bounds[0][2]),
                "max": float(np.max(bounds[1] - bounds[0])),
                "min": float(np.min(bounds[1] - bounds[0]))
            }
            
            # Centro de massa
            center_of_mass = mesh.centroid.tolist()
            
            # Tensor de inércia
            inertia_tensor = self._calculate_inertia(mesh, volume)
            
            # Bounding box detalhado
            bounding_box = {
                "min": bounds[0].tolist(),
                "max": bounds[1].tolist(),
                "center": ((bounds[0] + bounds[1]) / 2).tolist(),
                "size": (bounds[1] - bounds[0]).tolist()
            }
            
            # Informação da malha
            mesh_info = {
                "vertex_count": len(mesh.vertices),
                "face_count": len(mesh.faces),
                "edge_count": len(mesh.edges_unique),
                "face_types": self._analyze_face_types(mesh),
                "is_watertight": mesh.is_watertight,
                "is_convex": mesh.is_convex,
                "euler_number": mesh.euler_number,
                "genus": int((2 - mesh.euler_number) / 2) if mesh.is_watertight else None,
                "orientation": "consistent" if mesh.face_normals.shape[0] > 0 else "unknown"
            }
            
            # Métricas de complexidade
            complexity_metrics = self._calculate_complexity(mesh, volume, area, dimensions)
            
            # Análise de espessura (simplificada)
            thickness_analysis = self._analyze_thickness(mesh, bounds)
            
            # Análise de curvatura
            curvature = self._analyze_curvature(mesh)
            
            return {
                "volume": volume,
                "area": area,
                "dimensions": dimensions,
                "center_of_mass": center_of_mass,
                "inertia_tensor": inertia_tensor,
                "bounding_box": bounding_box,
                "mesh_info": mesh_info,
                "complexity_metrics": complexity_metrics,
                "thickness_analysis": thickness_analysis,
                "curvature": curvature,
                "manufacturing_analysis": self._analyze_manufacturing(mesh, complexity_metrics)
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de geometria: {e}")
            raise
    
    def _calculate_inertia(self, mesh: trimesh.Trimesh, volume: float) -> List[List[float]]:
        """
        Calcula tensor de inércia da malha.
        """
        try:
            if volume > 0:
                inertia = mesh.moment_inertia.tolist()
            else:
                # Tensor de inércia unitário para geometrias não fechadas
                inertia = [
                    [1.0, 0.0, 0.0],
                    [0.0, 1.0, 0.0],
                    [0.0, 0.0, 1.0]
                ]
            return inertia
        except Exception as e:
            logger.warning(f"Erro ao calcular inércia: {e}")
            return [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    
    def _analyze_face_types(self, mesh: trimesh.Trimesh) -> Dict[str, int]:
        """
        Analisa tipos de faces na malha.
        """
        try:
            # Obter ângulos das faces
            face_angles = mesh.face_angles
            
            # Classificar por tipo de triângulo
            triangles = {
                "acute": 0,      # Todos os ângulos < 90°
                "right": 0,      # Um ângulo = 90°
                "obtuse": 0      # Um ângulo > 90°
            }
            
            for angles in face_angles:
                if np.any(np.isclose(angles, 90, atol=1)):
                    triangles["right"] += 1
                elif np.all(angles < 90):
                    triangles["acute"] += 1
                else:
                    triangles["obtuse"] += 1
            
            return triangles
            
        except Exception as e:
            logger.warning(f"Erro na análise de tipos de face: {e}")
            return {"acute": 0, "right": 0, "obtuse": 0}
    
    def _calculate_complexity(self, mesh: trimesh.Trimesh, volume: float, 
                             area: float, dimensions: Dict) -> Dict[str, float]:
        """
        Calcula métricas de complexidade para fabrico.
        """
        try:
            # Relação superfície/volume (indicador de complexidade)
            surface_volume_ratio = area / volume if volume > 0 else 0
            
            # Compacidade (esfericidade da caixa delimitadora)
            max_dim = max(dimensions.values())
            min_dim = min(dimensions.values())
            compactness = min_dim / max_dim if max_dim > 0 else 0
            
            # Densidade de triângulos
            triangle_density = len(mesh.faces) / area if area > 0 else 0
            
            # Razão de aspecto média
            aspect_ratios = []
            for face in mesh.faces:
                v0, v1, v2 = mesh.vertices[face]
                edges = [
                    np.linalg.norm(v1 - v0),
                    np.linalg.norm(v2 - v1),
                    np.linalg.norm(v0 - v2)
                ]
                aspect_ratios.append(max(edges) / min(edges) if min(edges) > 0 else 1)
            
            avg_aspect_ratio = np.mean(aspect_ratios) if aspect_ratios else 1
            
            # Complexidade geométrica (0-100)
            complexity_score = min(100, (
                surface_volume_ratio * 10 +  # Maior SV ratio = mais complexo
                (1 - compactness) * 50 +     # Menos compacto = mais complexo
                triangle_density * 0.001 +   # Maior densidade = mais complexo
                (avg_aspect_ratio - 1) * 10  # Maior distorção = mais complexo
            ))
            
            return {
                "surface_volume_ratio": round(surface_volume_ratio, 4),
                "compactness": round(compactness, 4),
                "triangle_density": round(triangle_density, 4),
                "average_aspect_ratio": round(avg_aspect_ratio, 4),
                "complexity_score": round(complexity_score, 2),
                "difficulty_rating": self._get_difficulty_rating(complexity_score)
            }
            
        except Exception as e:
            logger.warning(f"Erro no cálculo de complexidade: {e}")
            return {
                "surface_volume_ratio": 0,
                "compactness": 1,
                "triangle_density": 0,
                "average_aspect_ratio": 1,
                "complexity_score": 50,
                "difficulty_rating": "Média"
            }
    
    def _get_difficulty_rating(self, score: float) -> str:
        """Converte score de complexidade em classificação legível."""
        if score < 25:
            return "Baixa"
        elif score < 50:
            return "Média"
        elif score < 75:
            return "Alta"
        else:
            return "Muito Alta"
    
    def _analyze_thickness(self, mesh: trimesh.Trimesh, bounds: np.ndarray) -> Dict:
        """
        Análise simplificada de espessura da peça.
        """
        try:
            # A análise completa requer algoritmos de ray casting
            # Aqui fazemos uma estimativa baseada nas dimensões
            
            size = bounds[1] - bounds[0]
            min_thickness = float(np.min(size) / 10)  # Estimativa conservadora
            
            return {
                "estimated_min_thickness": round(min_thickness, 2),
                "estimated_max_thickness": round(float(np.max(size) / 2), 2),
                "note": "Análise detalhada requer algoritmo de ray casting",
                "recommendation": "Considere usar análise CAE para otimização"
            }
            
        except Exception as e:
            logger.warning(f"Erro na análise de espessura: {e}")
            return {"error": str(e)}
    
    def _analyze_curvature(self, mesh: trimesh.Trimesh) -> Dict:
        """
        Análise de curvatura da superfície.
        """
        try:
            # Calcular curvatura usando vizinhos
            vertex_neighbors = mesh.vertex_neighbors
            
            curvatures = []
            for i, neighbors in enumerate(vertex_neighbors):
                if len(neighbors) >= 3:
                    # Aproximação de curvatura baseada em normais
                    v = mesh.vertices[i]
                    normal = mesh.vertex_normals[i]
                    
                    # Calcular variação espacial
                    variations = []
                    for n in neighbors[:5]:  # Limitar a 5 vizinhos
                        variations.append(np.linalg.norm(mesh.vertices[n] - v))
                    
                    curvature = np.std(variations) if variations else 0
                    curvatures.append(curvature)
            
            return {
                "mean_curvature": round(np.mean(curvatures), 4) if curvatures else 0,
                "max_curvature": round(np.max(curvatures), 4) if curvatures else 0,
                "curvature_variance": round(np.var(curvatures), 6) if curvatures else 0,
                "complex_curvature_regions": int(np.sum(np.array(curvatures) > np.mean(curvatures) * 2)) if curvatures else 0
            }
            
        except Exception as e:
            logger.warning(f"Erro na análise de curvatura: {e}")
            return {"error": str(e)}
    
    def _analyze_manufacturing(self, mesh: trimesh.Trimesh, 
                               complexity: Dict) -> Dict:
        """
        Análise de características relevantes para fabrico.
        """
        try:
            # Dificuldade de maquinação
            machining_difficulty = complexity.get("difficulty_rating", "Média")
            
            # Estimar tempo de maquinação (horas)
            volume = mesh.volume
            base_time = volume * 0.01  # 1 hora por 100 cm³ (simplificado)
            complexity_factor = complexity.get("complexity_score", 50) / 50
            
            estimated_machining_hours = round(base_time * complexity_factor, 1)
            
            # Recomendação de material
            material_recommendation = self._recommend_material(complexity)
            
            # Acabamento recomendado
            finish_recommendation = self._recommend_finish(mesh, complexity)
            
            return {
                "machining_difficulty": machining_difficulty,
                "estimated_machining_hours": estimated_machining_hours,
                "material_recommendation": material_recommendation,
                "finish_recommendation": finish_recommendation,
                "critical_features": self._identify_critical_features(mesh),
                "process_recommendations": self._get_process_recommendations(mesh, complexity)
            }
            
        except Exception as e:
            logger.warning(f"Erro na análise de fabrico: {e}")
            return {"error": str(e)}
    
    def _recommend_material(self, complexity: Dict) -> str:
        """Recomenda material baseado na complexidade."""
        score = complexity.get("complexity_score", 50)
        if score > 75:
            return "H13 (Aço para trabalho a quente - alta resistência)"
        elif score > 50:
            return "P20 (Aço para moldes - bom equilíbrio)"
        else:
            return "718 (Aço pré-endurecido - económico)"
    
    def _recommend_finish(self, mesh: trimesh.Trimesh, complexity: Dict) -> str:
        """Recomenda acabamento baseado na geometria."""
        if complexity.get("complexity_score", 50) > 70:
            return "EDM (Eletroerosão para geometrias complexas)"
        elif mesh.is_convex:
            return "Polido (Superfície acessível para polimento)"
        else:
            return "Texturizado (Para superfícies com detalhes)"
    
    def _identify_critical_features(self, mesh: trimesh.Trimesh) -> List[str]:
        """Identifica características críticas da peça."""
        features = []
        
        try:
            # Verificar existência de furos
            edges = mesh.edges_unique
            if len(edges) > len(mesh.faces) * 1.5:
                features.append("Furos/Multicavidades")
            
            # Verificar complexidade de forma
            if not mesh.is_convex:
                features.append("Geometria não-convexa")
            
            # Verificar aspect ratio extremos
            aspect_ratios = []
            for face in mesh.faces[:min(100, len(mesh.faces))]:
                v0, v1, v2 = mesh.vertices[face]
                edges = [
                    np.linalg.norm(v1 - v0),
                    np.linalg.norm(v2 - v1),
                    np.linalg.norm(v0 - v2)
                ]
                aspect_ratios.append(max(edges) / min(edges))
            
            if np.max(aspect_ratios) > 5:
                features.append("Paredes finas detetadas")
            
            if not features:
                features.append("Geometria padrão")
                
        except Exception:
            features = ["Análise não disponível"]
        
        return features
    
    def _get_process_recommendations(self, mesh: trimesh.Trimesh, 
                                     complexity: Dict) -> List[str]:
        """Recomenda processos de fabrico."""
        recommendations = []
        
        volume = mesh.volume
        score = complexity.get("complexity_score", 50)
        
        # Fresa de 3 eixos para geometrias simples
        if score < 40:
            recommendations.append("CNC 3-eixos para cavidades principais")
        
        # Fresa de 5 eixos para geometrias complexas
        if score >= 40:
            recommendations.append("CNC 5-eixos para acesso completo")
        
        # Eletroerosão para detalhes finos
        if complexity.get("average_aspect_ratio", 1) > 3:
            recommendations.append("EDM para detalhes e arestas vivas")
        
        # Impressão 3D para refrigeração conformal
        if score > 60:
            recommendations.append("DMLS para canais de refrigeração conformal")
        
        return recommendations
