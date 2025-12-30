import React, { useState } from 'react';
import { Settings, Cpu, Zap, Save, RefreshCw } from 'lucide-react';
import { GlobalSettings } from '../types';

interface SettingsViewProps {
  settings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof GlobalSettings, value: number) => {
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(localSettings);
      setIsSaving(false);
    }, 1000);
  };

  const handleReset = () => {
    setLocalSettings({
      cnc3AxisRate: 55,
      cnc5AxisRate: 85,
      edmRate: 75,
      iaAggressiveness: 0.5,
      materialMargin: 0.15
    });
  };

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Calibração de Algoritmo</h2>
        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
          <Cpu className="w-3 h-3" />
          Configurações Avançadas
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Taxas Horárias */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Taxas Horárias (EUR/h)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">CNC 3 Eixos</span>
                <span className="text-yellow-400 font-mono">€{localSettings.cnc3AxisRate}/h</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={localSettings.cnc3AxisRate}
                onChange={(e) => handleChange('cnc3AxisRate', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">CNC 5 Eixos</span>
                <span className="text-yellow-400 font-mono">€{localSettings.cnc5AxisRate}/h</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={localSettings.cnc5AxisRate}
                onChange={(e) => handleChange('cnc5AxisRate', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">EDM (Eletroerosão)</span>
                <span className="text-yellow-400 font-mono">€{localSettings.edmRate}/h</span>
              </div>
              <input
                type="range"
                min="40"
                max="120"
                value={localSettings.edmRate}
                onChange={(e) => handleChange('edmRate', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Parâmetros IA */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Parâmetros IA</h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Agressividade do Orçamentador</span>
                <span className="text-blue-400 font-mono">{(localSettings.iaAggressiveness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.iaAggressiveness}
                onChange={(e) => handleChange('iaAggressiveness', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Conservador</span>
                <span>Otimista</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Margem de Material</span>
                <span className="text-blue-400 font-mono">{(localSettings.materialMargin * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.05"
                value={localSettings.materialMargin}
                onChange={(e) => handleChange('materialMargin', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Restaurar Padrões
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              A Guardar...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Configurações
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-400">Nota sobre Configurações</h4>
            <p className="text-xs text-slate-400 mt-1">
              Estas configurações afetam todos os cálculos de orçamento futuros. As alterações são aplicadas imediatamente após guardar.
              Recomendamos documentar qualquer alteração para referência futura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
