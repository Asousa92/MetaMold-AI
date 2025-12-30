import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  AlertTriangle,
  Droplets,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Cpu,
  BookOpen,
  Info
} from 'lucide-react';
import { MaterialType, GeometryStats } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  type?: 'similarity' | 'tolerance' | 'cooling' | 'generic';
}

interface AICopilotProps {
  material: MaterialType;
  stats: GeometryStats | null;
}

const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);

  useEffect(() => {
    setDisplayedText('');
    index.current = 0;
    const interval = setInterval(() => {
      if (index.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index.current));
        index.current++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text]);

  return <p className="leading-relaxed whitespace-pre-wrap">{displayedText}</p>;
};

export const AICopilot: React.FC<AICopilotProps> = ({ material, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSuggestion = (type: 'similarity' | 'tolerance' | 'cooling') => {
    const userQueries = {
      similarity: "Encontrar Projetos Semelhantes",
      tolerance: "Verificar Tolerâncias (ISO)",
      cooling: "Sugerir Refrigeração"
    };

    const newUserMsg: Message = { role: 'user', content: userQueries[type] };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let response = "";
      let source = "";

      if (type === 'similarity') {
        response = `Analisei a topologia da peça. Encontrei 2 projetos anteriores na base vetorial com 85% de similaridade geométrica:

1. **Projeto #4590 (2022)** - Molde Gaveta Automóvel (Margem: 22%)
2. **Projeto #3100 (2021)** - Tampa Técnica Industrial.

*Sugestão:* O Projeto #4590 usou Aço H13 com tratamento térmico de têmpera. Recomendo manter o mesmo padrão para evitar empenos estruturais nesta espessura de parede.`;
        source = "Similaridade Topológica (V-DB)";
      } else if (type === 'tolerance') {
        response = `Atenção: Para o material selecionado (${material}), esta geometria fina pode exigir Eletroerosão (EDM) extra para garantir a tolerância H7 especificada.

Considere adicionar +4 horas de acabamento no orçamento para evitar desvios dimensionais após o arrefecimento.`;
        source = "Manual Interno de Maquinagem v2.1";
      } else if (type === 'cooling') {
        response = `Baseado no volume de ${stats?.volume.toFixed(2) || 'N/A'} cm³, detetei zonas de acumulação térmica no núcleo.

Recomendo a utilização de **Refrigeração Conformal** (DMLS) para reduzir o tempo de ciclo em cerca de 15%. O investimento extra compensa para lotes superiores a 50.000 injeções.`;
        source = "Módulo de Simulação Térmica CAE";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, source, type }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div
      className={`fixed right-0 top-16 bottom-0 transition-all duration-500 ease-in-out z-40 flex ${isOpen ? 'w-96' : 'w-12'}`}
    >
      <div className="flex items-center h-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-l-xl shadow-2xl transition-all h-24 flex items-center justify-center group"
        >
          {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:scale-125 transition-transform" />}
        </button>
      </div>

      <div className={`flex-1 bg-slate-900/40 backdrop-blur-xl border-l border-slate-700/50 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)] ${!isOpen && 'hidden'}`}>
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white uppercase">DevInvicta AI Engineer</h3>
              <p className="text-[10px] text-blue-400 font-mono animate-pulse flex items-center gap-1">
                <Terminal className="w-2 h-2" /> RAG-Context Mode Active
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700/30 flex items-center gap-3">
          <div className="flex-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">Análise em Tempo Real</span>
            <span className="text-[10px] text-slate-300 flex items-center gap-1">
               <Cpu className="w-3 h-3 text-blue-500" /> Material: {material}
            </span>
          </div>
          <div className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 font-mono">
            SYNCED
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500 px-4">Olá Eng. Ricardo. Sou o seu Copiloto de Engenharia. Como posso ajudar com este projeto?</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
              }`}>
                {msg.role === 'assistant' ? (
                  <TypewriterText text={msg.content} />
                ) : (
                  msg.content
                )}
                {msg.source && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1 text-[9px] text-blue-400 font-mono italic">
                    <BookOpen className="w-2 h-2" /> Fonte: {msg.source}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-2xl rounded-tl-none w-20 border border-slate-700/30">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900/60 border-t border-slate-700/50 space-y-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest px-1">Sugestões Inteligentes</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleSuggestion('similarity')}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-slate-300 transition-all text-left"
            >
              <Search className="w-3 h-3 text-blue-400" /> [🔍 Encontrar Projetos Semelhantes]
            </button>
            <button
              onClick={() => handleSuggestion('tolerance')}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-slate-300 transition-all text-left"
            >
              <AlertTriangle className="w-3 h-3 text-orange-400" /> [⚠️ Verificar Tolerâncias (ISO)]
            </button>
            <button
              onClick={() => handleSuggestion('cooling')}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-slate-300 transition-all text-left"
            >
              <Droplets className="w-3 h-3 text-cyan-400" /> [💧 Sugerir Refrigeração]
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800">
            <input
              type="text"
              placeholder="Escreva a sua dúvida técnica..."
              className="bg-transparent border-none text-[10px] flex-1 focus:ring-0 text-slate-300 placeholder:text-slate-600"
            />
            <div className="p-1.5 bg-blue-600/20 rounded-lg">
              <Sparkles className="w-3 h-3 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
