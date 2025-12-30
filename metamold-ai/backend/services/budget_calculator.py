"""
Serviço de cálculo de orçamentos para fabrico de moldes.
Calcula custos de material, processamento e estruturas.
"""

from typing import Dict, Optional, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class BudgetResult:
    """Resultado do cálculo de orçamento."""
    total_price: float
    breakdown: Dict
    material_cost: float
    processing_cost: float
    mold_base_cost: float
    setup_fee: float
    discount: float
    final_price: float

class BudgetCalculator:
    """
    Calculador de orçamentos para fabricação de moldes de injeção.
    """
    
    # Preços de materiais (EUR/cm³)
    MATERIAL_PRICES = {
        "H13": {"price": 0.85, "name": "Aço H13", "hardness": "48-52 HRC", "density": 7.8},
        "P20": {"price": 0.65, "name": "Aço P20", "hardness": "28-32 HRC", "density": 7.85},
        "718": {"price": 0.75, "name": "Aço 718", "hardness": "32-38 HRC", "density": 7.9},
        "ALUMINUM": {"price": 0.45, "name": "Alumínio 7075", "hardness": "60-65 HB", "density": 2.81},
        "S7": {"price": 0.70, "name": "Aço S7", "hardness": "54-58 HRC", "density": 7.7}
    }
    
    # Multiplicadores de acabamento
    FINISH_MULTIPLIERS = {
        "machined": {"multiplier": 1.0, "name": "Maquinado", "ra": 1.6},
        "ground": {"multiplier": 1.3, "name": "Retificado", "ra": 0.8},
        "polished": {"multiplier": 1.5, "name": "Polido", "ra": 0.2},
        "textured": {"multiplier": 1.8, "name": "Texturizado", "ra": 3.2},
        "edm": {"multiplier": 2.2, "name": "Eletroerosão (EDM)", "ra": 0.4}
    }
    
    # Custos base de estrutura (EUR)
    BASE_FIXED_FEE = 2500.0
    
    # Custos de extras de estrutura
    MOLD_BASE_EXTRAS = {
        "HOT_RUNNER": 3500.0,
        "CONFORMAL_COOLING": 5000.0,
        "DOUBLE_EXTRACTION": 1500.0,
        "LIFTING_HOLES": 300.0,
        "INSULATION": 800.0
    }
    
    # Preços de bases CAD (EUR)
    CAD_MOLD_BASE_PRICES = {
        "HASCO Standard": {"base": 3500, "series": "Z40/41"},
        "HASCO Premium": {"base": 4500, "series": "Z40/41 Premium"},
        "DME Standard": {"base": 3200, "series": "Mega"},
        "DME Premium": {"base": 4200, "series": "Mega Premium"},
        "FUTABA Standard": {"base": 3000, "series": "NB/NP"},
        "FUTABA Premium": {"base": 4000, "series": "NB/NP Premium"}
    }
    
    # Aditivos de material de placas
    PLATE_MATERIAL_ADDONS = {
        "Aço 1.1730 (C45W)": 0,
        "Aço 1.2311 (P20)": 200,
        "Aço 1.2312 (P20+S)": 350,
        "Aço 1.2344 (H13)": 800,
        "Alumínio 7075": -500,
        "Aço 1.2767 (H13 Mod)": 1200
    }
    
    # Taxas horárias (EUR/hora)
    HOURLY_RATES = {
        "cnc3Axis": 55.0,
        "cnc5Axis": 85.0,
        "edm": 75.0,
        "finishing": 45.0,
        "assembly": 50.0,
        "quality": 60.0
    }
    
    def __init__(self):
        self.initialized = True
    
    def calculate(
        self,
        stats: Dict,
        material: str,
        finish: str,
        quantity: int,
        mold_base_config: Optional[Dict] = None,
        cad_base_config: Optional[Dict] = None
    ) -> Dict:
        """
        Calcula orçamento completo para fabricação de molde.
        
        Args:
            stats: Estatísticas da geometria
            material: Tipo de material (H13, P20, etc.)
            finish: Tipo de acabamento
            quantity: Quantidade de peças
            mold_base_config: Configuração da base de molde
            cad_base_config: Configuração da base CAD
            
        Returns:
            Dicionário com orçamento detalhado
        """
        try:
            volume = stats.get("volume", 100)
            complexity = stats.get("complexity_metrics", {})
            manufacturing = stats.get("manufacturing_analysis", {})
            
            # Calcular custo de material
            material_cost = self._calculate_material_cost(volume, material)
            
            # Calcular custo de processamento
            processing_cost = self._calculate_processing_cost(
                volume, material, finish, complexity, manufacturing
            )
            
            # Calcular custo da base de molde
            mold_base_cost = self._calculate_mold_base_cost(
                mold_base_config, cad_base_config
            )
            
            # Calcular taxa de setup
            setup_fee = self._calculate_setup_fee(mold_base_config)
            
            # Calcular subtotal
            subtotal = material_cost + processing_cost + mold_base_cost + setup_fee
            
            # Aplicar desconto por quantidade
            discount = self._calculate_discount(quantity)
            discount_amount = subtotal * discount
            
            # Preço final
            total_price = subtotal - discount_amount
            
            # Limitar casas decimais
            total_price = round(total_price, 2)
            
            breakdown = {
                "material_cost": round(material_cost, 2),
                "processing_cost": round(processing_cost, 2),
                "mold_base_cost": round(mold_base_cost, 2),
                "setup_fee": round(setup_fee, 2),
                "subtotal": round(subtotal, 2),
                "discount_percent": f"{discount * 100:.0f}%",
                "discount_amount": round(discount_amount, 2),
                "quantity": quantity,
                "price_per_piece": round(total_price / quantity, 2) if quantity > 0 else 0
            }
            
            return {
                "total_price": total_price,
                "breakdown": breakdown,
                "material_cost": material_cost,
                "processing_cost": processing_cost,
                "mold_base_cost": mold_base_cost,
                "setup_fee": setup_fee,
                "discount": discount,
                "final_price": total_price,
                "material_info": self.MATERIAL_PRICES.get(material, {}),
                "finish_info": self.FINISH_MULTIPLIERS.get(finish, {}),
                "manufacturing_recommendations": manufacturing.get("process_recommendations", [])
            }
            
        except Exception as e:
            logger.error(f"Erro no cálculo de orçamento: {e}")
            raise
    
    def _calculate_material_cost(self, volume: float, material: str) -> float:
        """Calcula custo do material baseado no volume."""
        material_info = self.MATERIAL_PRICES.get(material, self.MATERIAL_PRICES["P20"])
        price_per_cm3 = material_info["price"]
        
        # Considerar desperdício (15%)
        gross_volume = volume * 1.15
        
        return gross_volume * price_per_cm3
    
    def _calculate_processing_cost(
        self,
        volume: float,
        material: str,
        finish: str,
        complexity: Dict,
        manufacturing: Dict
    ) -> float:
        """
        Calcula custo de processamento/custeio.
        Baseado em volume, complexidade e acabamento.
        """
        # Tempo base de maquinação (minutos por cm³)
        base_rate = 0.5  # minutos por cm³
        
        # Fator de complexidade
        complexity_factor = complexity.get("complexity_score", 50) / 50
        
        # Tempo total de maquinação
        machining_minutes = volume * base_rate * (1 + complexity_factor * 0.5)
        
        # Selecionar taxa horária baseada na complexidade
        if complexity_factor > 0.7:
            hourly_rate = self.HOURLY_RATES["cnc5Axis"]
        elif complexity_factor > 0.4:
            hourly_rate = self.HOURLY_RATES["cnc3Axis"]
        else:
            hourly_rate = self.HOURLY_RATES["cnc3Axis"] * 0.9
        
        machining_cost = (machining_minutes / 60) * hourly_rate
        
        # Custo de acabamento
        finish_info = self.FINISH_MULTIPLIERS.get(finish, self.FINISH_MULTIPLIERS["machined"])
        finish_multiplier = finish_info["multiplier"]
        
        # Acabamento é percentual do custo de maquinação base
        finish_cost = machining_cost * (finish_multiplier - 1) * 0.3
        
        # Custo de eletroerosão se necessário
        edm_cost = 0
        if finish == "edm" or complexity_factor > 0.8:
            edm_minutes = volume * 0.2
            edm_cost = (edm_minutes / 60) * self.HOURLY_RATES["edm"]
        
        # Custo de acabamento manual
        finishing_minutes = volume * 0.1 * finish_multiplier
        finishing_cost = (finishing_minutes / 60) * self.HOURLY_RATES["finishing"]
        
        # Custo de montagem
        assembly_hours = 8 + complexity_factor * 4
        assembly_cost = assembly_hours * self.HOURLY_RATES["assembly"]
        
        # Custo de controlo de qualidade
        qa_hours = 4 + complexity_factor * 2
        qa_cost = qa_hours * self.HOURLY_RATES["quality"]
        
        return machining_cost + finish_cost + edm_cost + finishing_cost + assembly_cost + qa_cost
    
    def _calculate_mold_base_cost(
        self,
        mold_base_config: Optional[Dict],
        cad_base_config: Optional[Dict]
    ) -> float:
        """Calcula custo da base de molde."""
        cost = 0
        
        if cad_base_config:
            supplier = cad_base_config.get("supplier", "HASCO Standard")
            base_info = self.CAD_MOLD_BASE_PRICES.get(supplier, self.CAD_MOLD_BASE_PRICES["HASCO Standard"])
            cost += base_info["base"]
            
            # Aditivo de material
            plate_material = cad_base_config.get("plateMaterial", "Aço 1.1730 (C45W)")
            cost += self.PLATE_MATERIAL_ADDONS.get(plate_material, 0)
            
            # Extras
            if cad_base_config.get("insulationPlates"):
                cost += self.MOLD_BASE_EXTRAS["INSULATION"]
            if cad_base_config.get("liftingHoles"):
                cost += self.MOLD_BASE_EXTRAS["LIFTING_HOLES"]
        
        elif mold_base_config:
            # Configuração legacy
            width = mold_base_config.get("plateWidth", 296)
            length = mold_base_config.get("plateLength", 296)
            
            # Custo base proporcional às dimensões
            base_cost = (width * length) / 10000 * 400
            cost += base_cost
            
            # Extras
            if mold_base_config.get("hotRunner"):
                cost += self.MOLD_BASE_EXTRAS["HOT_RUNNER"]
            if mold_base_config.get("conformalCooling"):
                cost += self.MOLD_BASE_EXTRAS["CONFORMAL_COOLING"]
            if mold_base_config.get("doubleExtraction"):
                cost += self.MOLD_BASE_EXTRAS["DOUBLE_EXTRACTION"]
        
        else:
            # Custo base padrão
            cost = 3000
        
        return cost
    
    def _calculate_setup_fee(self, mold_base_config: Optional[Dict]) -> float:
        """Calcula taxa de setup/projeto."""
        fee = self.BASE_FIXED_FEE
        
        # Adicionar custos de engenharia se aplicável
        if mold_base_config:
            if mold_base_config.get("conformalCooling"):
                fee += 1500  # Engenharia de refrigeração conformal
        
        return fee
    
    def _calculate_discount(self, quantity: int) -> float:
        """Calcula desconto baseado na quantidade."""
        if quantity >= 100:
            return 0.15
        elif quantity >= 50:
            return 0.10
        elif quantity >= 10:
            return 0.05
        else:
            return 0.0
    
    def get_material_list(self) -> List[Dict]:
        """Retorna lista de materiais disponíveis."""
        return [
            {"id": key, **value} for key, value in self.MATERIAL_PRICES.items()
        ]
    
    def get_finish_list(self) -> List[Dict]:
        """Retorna lista de acabamentos disponíveis."""
        return [
            {"id": key, **value} for key, value in self.FINISH_MULTIPLIERS.items()
        ]
    
    def get_mold_base_list(self) -> List[Dict]:
        """Retorna lista de bases de molde disponíveis."""
        return [
            {"id": key, **value} for key, value in self.CAD_MOLD_BASE_PRICES.items()
        ]
