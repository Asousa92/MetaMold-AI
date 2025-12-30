export type MaterialType = 'H13' | 'P20' | '718' | 'ALUMINUM' | 'S7';

export type FinishType = 'machined' | 'ground' | 'polished' | 'textured' | 'edm';

export type AppView = 'client' | 'engineering' | 'mold-base' | 'cad-mold-base' | 'management' | 'settings';

export interface GeometryStats {
  volume: number;
  area: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
    max: number;
    min: number;
  };
  center_of_mass: number[];
  bounding_box: {
    min: number[];
    max: number[];
    center: number[];
    size: number[];
  };
  mesh_info: {
    vertex_count: number;
    face_count: number;
    is_watertight: boolean;
    complexity_score: number;
    difficulty_rating: string;
  };
  complexity_metrics?: {
    surface_volume_ratio: number;
    compactness: number;
    complexity_score: number;
    difficulty_rating: string;
  };
  manufacturing_analysis?: {
    machining_difficulty: string;
    material_recommendation: string;
    finish_recommendation: string;
    process_recommendations: string[];
  };
}

export interface FileMetadata {
  name: string;
  size: number;
  type: 'STL' | 'STEP' | 'SLDPRT';
}

export interface MoldBaseConfig {
  standard: string;
  plateWidth: number;
  plateLength: number;
  stackHeight: number;
  hotRunner: boolean;
  conformalCooling: boolean;
  doubleExtraction: boolean;
}

export interface CadMoldBaseConfig {
  supplier: string;
  plateMaterial: string;
  packageHeight: number;
  insulationPlates: boolean;
  liftingHoles: boolean;
}

export interface GlobalSettings {
  cnc3AxisRate: number;
  cnc5AxisRate: number;
  edmRate: number;
  iaAggressiveness: number;
  materialMargin: number;
}

export interface BudgetBreakdown {
  material_cost: number;
  processing_cost: number;
  mold_base_cost: number;
  setup_fee: number;
  subtotal: number;
  discount_percent: string;
  discount_amount: number;
  quantity: number;
  price_per_piece: number;
}

export interface StepConversionResponse {
  success: boolean;
  geometry_type: string;
  vertices_count: number;
  faces_count: number;
  bounding_box: {
    min: number[];
    max: number[];
  };
  center: number[];
  message: string;
}
