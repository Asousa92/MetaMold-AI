import { MaterialType, FinishType } from './types';

export const DEFAULT_SETTINGS = {
  cnc3AxisRate: 55,
  cnc5AxisRate: 85,
  edmRate: 75,
  iaAggressiveness: 0.5,
  materialMargin: 0.15
};

export const MATERIAL_PRICES: Record<MaterialType, { price: number; name: string; hardness: string }> = {
  H13: { price: 0.85, name: 'Aço H13', hardness: '48-52 HRC' },
  P20: { price: 0.65, name: 'Aço P20', hardness: '28-32 HRC' },
  '718': { price: 0.75, name: 'Aço 718', hardness: '32-38 HRC' },
  ALUMINUM: { price: 0.45, name: 'Alumínio 7075', hardness: '60-65 HB' },
  S7: { price: 0.70, name: 'Aço S7', hardness: '54-58 HRC' }
};

export const FINISH_MULTIPLIERS: Record<FinishType, { multiplier: number; name: string; ra: number }> = {
  machined: { multiplier: 1.0, name: 'Maquinado', ra: 1.6 },
  ground: { multiplier: 1.3, name: 'Retificado', ra: 0.8 },
  polished: { multiplier: 1.5, name: 'Polido', ra: 0.2 },
  textured: { multiplier: 1.8, name: 'Texturizado', ra: 3.2 },
  edm: { multiplier: 2.2, name: 'Eletroerosão (EDM)', ra: 0.4 }
};

export const BASE_FIXED_FEE = 2500;

export const MOLD_BASE_EXTRAS = {
  HOT_RUNNER: 3500,
  CONFORMAL_COOLING: 5000,
  DOUBLE_EXTRACTION: 1500
};

export const CAD_MOLD_BASE_PRICES: Record<string, { base: number; series: string }> = {
  'HASCO Standard': { base: 3500, series: 'Z40/41' },
  'HASCO Premium': { base: 4500, series: 'Z40/41 Premium' },
  'DME Standard': { base: 3200, series: 'Mega' },
  'DME Premium': { base: 4200, series: 'Mega Premium' },
  'FUTABA Standard': { base: 3000, series: 'NB/NP' },
  'FUTABA Premium': { base: 4000, series: 'NB/NP Premium' }
};

export const PLATE_MATERIAL_ADDONS: Record<string, number> = {
  'Aço 1.1730 (C45W)': 0,
  'Aço 1.2311 (P20)': 200,
  'Aço 1.2312 (P20+S)': 350,
  'Aço 1.2344 (H13)': 800,
  'Alumínio 7075': -500,
  'Aço 1.2767 (H13 Mod)': 1200
};

export const CAD_EXTRAS = {
  INSULATION: 800,
  LIFTING_HOLES: 300
};
