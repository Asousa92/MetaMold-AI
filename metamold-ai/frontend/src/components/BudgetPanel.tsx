import React from 'react';
import { FileText, Calculator, Download, ChevronDown } from 'lucide-react';
import { GeometryStats, FileMetadata, MaterialType, FinishType } from '../types';
import { MATERIAL_PRICES, FINISH_MULTIPLIERS } from '../constants';

interface BudgetPanelProps {
  stats: GeometryStats | null;
  metadata: FileMetadata | null;
  material: MaterialType;
  finish: FinishType;
  quantity: number;
  onMaterialChange: (material: MaterialType) => void;
  onFinishChange: (finish: FinishType) => void;
  onQuantityChange: (quantity: number) => void;
  totalPriceOverride?: number;
  onGeneratePDF: () => void;
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({
  stats,
  metadata,
  material,
  finish,
  quantity,
  onMaterialChange,
  onFinishChange,
  onQuantityChange,
  totalPriceOverride,
  onGeneratePDF
}) => {
  return (
    <div className="w-96 flex flex-col gap-4">
      {/* Painel de Ficheiro */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Informação do Ficheiro</h3>
        </div>

        {metadata ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
              <span className="text-xs text-slate-400">Nome</span>
              <span className="text-xs font-mono text-white truncate max-w-[150px]">{metadata.name}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
              <span className="text-xs text-slate-400">Formato</span>
              <span className="text-xs font-bold text-blue-400">{metadata.type}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
              <span className="text-xs text-slate-400">Volume</span>
              <span className="text-xs font-mono text-white">{stats?.volume.toFixed(2) || '---'} cm³</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
              <span className="text-xs text-slate-400">Dimensões</span>
              <span className="text-xs font-mono text-white">
                {stats ? `${stats.dimensions.x.toFixed(0)} × ${stats.dimensions.y.toFixed(0)} × ${stats.dimensions.z.toFixed(0)}` : '---'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            Carregue um ficheiro para iniciar
          </div>
        )}
      </div>

      {/* Configurações de Fabrico */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Configurações</h3>
        </div>

        <div className="space-y-4">
          {/* Material */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Material</label>
            <div className="relative">
              <select
                value={material}
                onChange={(e) => onMaterialChange(e.target.value as MaterialType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(MATERIAL_PRICES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} - €{value.price.toFixed(2)}/cm³ ({value.hardness})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Acabamento */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Acabamento</label>
            <div className="relative">
              <select
                value={finish}
                onChange={(e) => onFinishChange(e.target.value as FinishType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(FINISH_MULTIPLIERS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} (x{value.multiplier.toFixed(1)})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Quantidade</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Preço Final */}
      <div className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 rounded-2xl border border-blue-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Orçamento Total</span>
          {quantity >= 50 && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
              -10% Volume
            </span>
          )}
          {quantity >= 10 && quantity < 50 && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
              -5% Quantidade
            </span>
          )}
        </div>

        <div className="text-center mb-4">
          <span className="text-4xl font-mono font-bold text-white">
            €{totalPriceOverride?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || '0,00'}
          </span>
        </div>

        <button
          onClick={onGeneratePDF}
          disabled={!stats || !metadata}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar Orçamento PDF
        </button>
      </div>
    </div>
  );
};
