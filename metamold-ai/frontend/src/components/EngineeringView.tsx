import React from 'react';
import { Activity, Cpu, Zap, Thermometer, Settings } from 'lucide-react';
import { GeometryStats } from '../types';

interface EngineeringViewProps {
  stats: GeometryStats | null;
}

export const EngineeringView: React.FC<EngineeringViewProps> = ({ stats }) => {
  const complexity = stats?.complexity_metrics || {
    surface_volume_ratio: 0,
    compactness: 0,
    complexity_score: 50,
    difficulty_rating: 'Média'
  };

  const manufacturing = stats?.manufacturing_analysis || {
    machining_difficulty: 'Média',
    material_recommendation: 'P20 (Aço para moldes)',
    finish_recommendation: 'Polido',
    process_recommendations: ['CNC 3-eixos', 'EDM para detalhes']
  };

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Engenharia & Design Preditivo</h2>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
          <Activity className="w-3 h-3" />
          Módulo CAE Ativo
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Card de Complexidade */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Análise de Complexidade</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Índice de Complexidade</span>
                <span className="text-blue-400 font-mono">{complexity.complexity_score}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${complexity.complexity_score}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 block">Relação S/V</span>
                <span className="text-sm font-mono text-white">{complexity.surface_volume_ratio.toFixed(3)}</span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <span className="text-[10px] text-slate-500 block">Compacidade</span>
                <span className="text-sm font-mono text-white">{complexity.compactness.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
              <Settings className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-300">Dificuldade: <span className="text-orange-400 font-bold">{complexity.difficulty_rating}</span></span>
            </div>
          </div>
        </div>

        {/* Card de Processos */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Processos Recomendados</h3>
          </div>

          <div className="space-y-3">
            {manufacturing.process_recommendations.map((process, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-white">{process}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Material */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Recomendações</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Material Sugerido</span>
              <span className="text-sm text-blue-400 font-semibold">{manufacturing.material_recommendation}</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Acabamento</span>
              <span className="text-sm text-green-400 font-semibold">{manufacturing.finish_recommendation}</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <span className="text-[10px] text-slate-500 block uppercase">Dificuldade</span>
              <span className="text-sm text-orange-400 font-semibold">{manufacturing.machining_difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Avançadas */}
      {stats && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Métricas Avançadas</h3>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-800/30 rounded-xl">
              <div className="text-2xl font-mono font-bold text-blue-400">{stats.mesh_info?.vertex_count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">Vértices</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-xl">
              <div className="text-2xl font-mono font-bold text-green-400">{stats.mesh_info?.face_count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">Faces</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-xl">
              <div className="text-2xl font-mono font-bold text-orange-400">{stats.bounding_box?.size?.[0]?.toFixed(1) || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">Largura (mm)</div>
            </div>
            <div className="text-center p-4 bg-slate-800/30 rounded-xl">
              <div className="text-2xl font-mono font-bold text-purple-400">{stats.bounding_box?.size?.[2]?.toFixed(1) || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase mt-1">Profundidade (mm)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
