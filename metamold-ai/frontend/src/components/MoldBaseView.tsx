import React from 'react';
import { Layers, Settings, Zap, Droplets, Box } from 'lucide-react';
import { MoldBaseConfig } from '../types';

interface MoldBaseViewProps {
  config: MoldBaseConfig;
  onChange: (config: MoldBaseConfig) => void;
}

export const MoldBaseView: React.FC<MoldBaseViewProps> = ({ config, onChange }) => {
  const handleChange = (field: keyof MoldBaseConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Norma de Fabrico</h2>
        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
          <Layers className="w-3 h-3" />
          HASCO Standard
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Configuração de Dimensões */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Box className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Dimensões da Placa</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Standard</label>
              <select
                value={config.standard}
                onChange={(e) => handleChange('standard', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HASCO Standard">HASCO Standard</option>
                <option value="DME Standard">DME Standard</option>
                <option value="FUTABA Standard">FUTABA Standard</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Largura (mm)</label>
                <input
                  type="number"
                  value={config.plateWidth}
                  onChange={(e) => handleChange('plateWidth', parseInt(e.target.value) || 296)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Comprimento (mm)</label>
                <input
                  type="number"
                  value={config.plateLength}
                  onChange={(e) => handleChange('plateLength', parseInt(e.target.value) || 296)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Altura de Montagem (mm)</label>
              <input
                type="range"
                min="200"
                max="600"
                value={config.stackHeight}
                onChange={(e) => handleChange('stackHeight', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>200mm</span>
                <span className="text-blue-400 font-mono">{config.stackHeight}mm</span>
                <span>600mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Extras */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Opções de Fabrico</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={config.hotRunner}
                onChange={(e) => handleChange('hotRunner', e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Hot Runner
                </div>
                <div className="text-[10px] text-slate-400">Sistema de alimentação quente (+€3.500)</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={config.conformalCooling}
                onChange={(e) => handleChange('conformalCooling', e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Refrigeração Conformal
                </div>
                <div className="text-[10px] text-slate-400">Canais de refrigeração complexos via DMLS (+€5.000)</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={config.doubleExtraction}
                onChange={(e) => handleChange('doubleExtraction', e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-400" />
                  Dupla Extração
                </div>
                <div className="text-[10px] text-slate-400">Sistema de extração em duas etapas (+€1.500)</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-r from-blue-900/30 to-slate-900/30 rounded-2xl border border-blue-800/50 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Resumo da Configuração</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-blue-400">{config.plateWidth}×{config.plateLength}</div>
            <div className="text-[10px] text-slate-500 uppercase">Placa (mm)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-green-400">{config.stackHeight}</div>
            <div className="text-[10px] text-slate-500 uppercase">Altura (mm)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-orange-400">
              {[config.hotRunner, config.conformalCooling, config.doubleExtraction].filter(Boolean).length}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Opções Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-purple-400">
              {(config.hotRunner ? 3500 : 0) + (config.conformalCooling ? 5000 : 0) + (config.doubleExtraction ? 1500 : 0)}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Custo Extras (€)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
