import React from 'react';
import { Database, Package, Thermometer, Anchor } from 'lucide-react';
import { CadMoldBaseConfig, GeometryStats } from '../types';

interface CadMoldBaseViewProps {
  config: CadMoldBaseConfig;
  stats: GeometryStats | null;
  onChange: (config: CadMoldBaseConfig) => void;
}

const SUPPLIERS = [
  { id: 'HASCO', name: 'HASCO', series: ['Standard', 'Premium'] },
  { id: 'DME', name: 'DME', series: ['Standard', 'Premium'] },
  { id: 'FUTABA', name: 'FUTABA', series: ['Standard', 'Premium'] }
];

const PLATE_MATERIALS = [
  'Aço 1.1730 (C45W)',
  'Aço 1.2311 (P20)',
  'Aço 1.2312 (P20+S)',
  'Aço 1.2344 (H13)',
  'Alumínio 7075',
  'Aço 1.2767 (H13 Mod)'
];

const DIMENSIONS = [
  { width: 250, length: 250, height: 300 },
  { width: 296, length: 296, height: 350 },
  { width: 350, length: 350, height: 400 },
  { width: 396, length: 396, height: 400 },
  { width: 496, length: 496, height: 450 }
];

export const CadMoldBaseView: React.FC<CadMoldBaseViewProps> = ({ config, stats, onChange }) => {
  const handleChange = (field: keyof CadMoldBaseConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  // Calcular custo base
  const basePrice = config.supplier.includes('HASCO') ? 3500 :
                    config.supplier.includes('DME') ? 3200 : 3000;
  const materialAddon = config.plateMaterial.includes('1.2344') ? 800 :
                        config.plateMaterial.includes('2311') ? 200 :
                        config.plateMaterial.includes('Alumínio') ? -500 : 0;
  const extras = (config.insulationPlates ? 800 : 0) + (config.liftingHoles ? 300 : 0);

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Estruturas Normalizadas CAD</h2>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
          <Database className="w-3 h-3" />
          Base de Dados Ativa
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Seleção de Fornecedor */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Fornecedor</h3>
          </div>

          <div className="space-y-3">
            {SUPPLIERS.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => handleChange('supplier', `${supplier.name} Standard`)}
                className={`w-full p-4 rounded-xl border transition-all ${
                  config.supplier.includes(supplier.id)
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold">{supplier.name}</div>
                <div className="text-[10px] opacity-70">{supplier.series.join(' / ')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Material e Dimensões */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Material & Dimensões</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Material das Placas</label>
              <select
                value={config.plateMaterial}
                onChange={(e) => handleChange('plateMaterial', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLATE_MATERIALS.map((mat) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Dimensões Recomendadas</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIMENSIONS.map((dim, idx) => (
                  <option key={idx} value={idx}>
                    {dim.width}×{dim.length}mm (H{dim.height}mm)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Altura do Pacote (mm)</label>
              <input
                type="number"
                value={config.packageHeight}
                onChange={(e) => handleChange('packageHeight', parseInt(e.target.value) || 350)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Acessórios */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Acessórios</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={config.insulationPlates}
                onChange={(e) => handleChange('insulationPlates', e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div>
                <div className="text-sm font-semibold text-white">Placas Isolantes</div>
                <div className="text-[10px] text-slate-400">+€800</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={config.liftingHoles}
                onChange={(e) => handleChange('liftingHoles', e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div>
                <div className="text-sm font-semibold text-white">Furos de Elevação</div>
                <div className="text-[10px] text-slate-400">+€300</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Resumo de Custo */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Estimativa de Custo</h3>

        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="text-lg font-mono font-bold text-blue-400">€{basePrice}</div>
            <div className="text-[10px] text-slate-500 uppercase">Estrutura Base</div>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="text-lg font-mono font-bold text-green-400">€{materialAddon}</div>
            <div className="text-[10px] text-slate-500 uppercase">Material</div>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="text-lg font-mono font-bold text-orange-400">€{extras}</div>
            <div className="text-[10px] text-slate-500 uppercase">Acessórios</div>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-xl">
            <div className="text-lg font-mono font-bold text-purple-400">€{basePrice + materialAddon + extras}</div>
            <div className="text-[10px] text-slate-500 uppercase">Subtotal</div>
          </div>
          <div className="text-center p-4 bg-blue-900/30 rounded-xl border border-blue-500/30">
            <div className="text-lg font-mono font-bold text-white">€{(basePrice + materialAddon + extras) * 1.1}</div>
            <div className="text-[10px] text-blue-400 uppercase">Total +IVA</div>
          </div>
        </div>
      </div>
    </div>
  );
};
