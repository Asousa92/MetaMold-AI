/**
 * Serviço de comunicação com o backend Python para processamento de ficheiros STEP.
 */

import { StepConversionResponse, GeometryStats, BudgetBreakdown } from '../types';

const API_BASE = '/api';

export const stepService = {
  async processStepFile(file: File): Promise<StepConversionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/step`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao processar ficheiro STEP');
    }

    return response.json();
  },

  async analyzeGeometry(file: File): Promise<{ stats: GeometryStats; success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/geometry/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao analisar geometria');
    }

    return response.json();
  },

  async calculateBudget(
    file: File,
    material: string,
    finish: string,
    quantity: number,
    moldBaseConfig?: any,
    cadBaseConfig?: any
  ): Promise<{ total_price: number; breakdown: BudgetBreakdown }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('material', material);
    formData.append('finish', finish);
    formData.append('quantity', quantity.toString());

    if (moldBaseConfig) {
      formData.append('mold_base_config', JSON.stringify(moldBaseConfig));
    }
    if (cadBaseConfig) {
      formData.append('cad_base_config', JSON.stringify(cadBaseConfig));
    }

    const response = await fetch(`${API_BASE}/budget/calculate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao calcular orçamento');
    }

    return response.json();
  }
};

export const apiService = {
  async getHealth(): Promise<{ status: string; services: Record<string, boolean> }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  async getMaterials(): Promise<{ materials: Array<{ id: string; name: string; price_per_cm3: number; hardness: string }> }> {
    const response = await fetch(`${API_BASE}/materials`);
    return response.json();
  },

  async getFinishes(): Promise<{ finishes: Array<{ id: string; name: string; multiplier: number; description: string }> }> {
    const response = await fetch(`${API_BASE}/finishes`);
    return response.json();
  },

  async getMoldBases(): Promise<{ mold_bases: Array<{ supplier: string; series: string; plates: string[]; dimensions: any[]; price_range: { min: number; max: number } }> }> {
    const response = await fetch(`${API_BASE}/mold-bases`);
    return response.json();
  }
};
