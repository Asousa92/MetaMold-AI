import React from 'react';
import { LayoutDashboard, TrendingUp, Clock, Target, BarChart3, Users } from 'lucide-react';

export const ManagementView: React.FC = () => {
  const kpis = [
    { label: 'Orçamentos Este Mês', value: '47', change: '+12%', icon: Target, color: 'blue' },
    { label: 'Taxa de Aprovação', value: '68%', change: '+5%', icon: TrendingUp, color: 'green' },
    { label: 'Tempo Médio', value: '2.3h', change: '-18%', icon: Clock, color: 'orange' },
    { label: 'Novos Clientes', value: '8', change: '+3', icon: Users, color: 'purple' }
  ];

  const recentProjects = [
    { id: 'PRJ-2024-001', client: 'AutoTech Industries', value: '€45,200', status: 'Em Curso', date: '2024-01-15' },
    { id: 'PRJ-2024-002', client: 'Plásticos Costa', value: '€28,500', status: 'Aprovado', date: '2024-01-14' },
    { id: 'PRJ-2024-003', client: 'TechMold SA', value: '€67,800', status: 'Em Análise', date: '2024-01-13' },
    { id: 'PRJ-2024-004', client: 'Injectoplast Lda', value: '€34,200', status: 'Pendente', date: '2024-01-12' },
    { id: 'PRJ-2024-005', client: 'MetalForm Inc', value: '€89,500', status: 'Em Curso', date: '2024-01-11' }
  ];

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gestão Industrial</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          <LayoutDashboard className="w-3 h-3" />
          Dashboard Operacional
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${kpi.color}-500/20`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-400`} />
              </div>
              <span className={`text-[10px] font-bold ${
                kpi.change.startsWith('+') ? 'text-green-400' : 'text-orange-400'
              }`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">{kpi.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Gráfico de Atividade */}
        <div className="col-span-2 bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Atividade Semanal</h3>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-end justify-between h-40 gap-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, idx) => {
              const heights = [60, 85, 45, 90, 75, 40, 30];
              const height = heights[idx];
              return (
                <div key={day} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full bg-blue-500/50 hover:bg-blue-500 transition-all rounded-t-lg cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '20px' }}
                  ></div>
                  <span className="text-[10px] text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status de Projetos */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Status dos Projetos</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-white">Em Curso</span>
              </div>
              <span className="text-sm font-mono font-bold text-blue-400">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-white">Aprovados</span>
              </div>
              <span className="text-sm font-mono font-bold text-green-400">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-white">Em Análise</span>
              </div>
              <span className="text-sm font-mono font-bold text-yellow-400">5</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-xs text-white">Pendentes</span>
              </div>
              <span className="text-sm font-mono font-bold text-slate-400">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projetos Recentes */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Projetos Recentes</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-700">
                <th className="text-left py-3 px-4">Projeto</th>
                <th className="text-left py-3 px-4">Cliente</th>
                <th className="text-right py-3 px-4">Valor</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono font-bold text-blue-400">{project.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-white">{project.client}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-mono font-bold text-green-400">{project.value}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      project.status === 'Em Curso' ? 'bg-blue-500/20 text-blue-400' :
                      project.status === 'Aprovado' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'Em Análise' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-xs text-slate-500">{project.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
