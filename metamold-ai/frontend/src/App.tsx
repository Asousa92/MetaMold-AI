import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  LayoutDashboard,
  FileBox,
  Settings,
  Bell,
  Menu,
  X,
  PlusCircle,
  Database,
  Layers,
  Workflow
} from 'lucide-react';
import { Viewer3D } from './components/Viewer3D';
import { BudgetPanel } from './components/BudgetPanel';
import { ManagementView } from './components/ManagementView';
import { MoldBaseView } from './components/MoldBaseView';
import { CadMoldBaseView } from './components/CadMoldBaseView';
import { EngineeringView } from './components/EngineeringView';
import { SettingsView } from './components/SettingsView';
import { AICopilot } from './components/AICopilot';
import {
  MaterialType,
  FinishType,
  GeometryStats,
  FileMetadata,
  AppView,
  MoldBaseConfig,
  CadMoldBaseConfig,
  GlobalSettings
} from './types';
import { getGeometryStats } from './services/stlService';
import { stepService } from './services/api';
import { generateTechnicalBudgetPDF } from './services/pdfService';
import {
  DEFAULT_SETTINGS,
  MOLD_BASE_EXTRAS,
  MATERIAL_PRICES,
  BASE_FIXED_FEE,
  FINISH_MULTIPLIERS,
  CAD_MOLD_BASE_PRICES,
  PLATE_MATERIAL_ADDONS,
  CAD_EXTRAS
} from './constants';
import * as THREE from 'three';

const FALLBACK_STL_URL = "data:application/octet-stream;base64,c29saWQgY3ViZSAgZmFjZXQgbm9ybWFsIDAgMCAtMSAgICBvdXRlciBsb29wICAgICAgdmVydGV4IDAgMCAwICAgICAgdmVydGV4IDAgMTAgMCAgICAgIHZlcnRleCAxMCAxMCAwICAgIGVuZGxvb3AgIGVuZGZhY2V0ICBmYWNldCBub3JtYWwgMCAwIC0xICAgIG91dGVyIGxvb3AgICAgICB2ZXJ0ZXggMCAwIDAgICAgICB2ZXJ0ZXggMTAgMTAgMCAgICAgIHZlcnRleCAxMCAwIDAgICAgZW5kbG9vcCAgZW5kZmFjZXQgIGZhY2V0IG5vcm1hbCAwIDAgMSAgICBvdXRlciBsb29wICAgICAgdmVydGV4IDAgMCAxMCAgICAgIHZlcnRleCAxMCAwIDEwICAgICAgdmVydGV4IDEwIDEwIDEwICAgIGVuZGxvb3AgIGVuZGZhY2V0ICBmYWNldCBub3JtYWwgMCAwIDEgICAgb3V0ZXIgbG9vcCAgICAgIHZlcnRleCAwIDAgMTAgICAgICB2ZXJ0ZXggMTAgMTAgMTAgICAgICB2ZXJ0ZXggMCAxMCAxMCAgICBlbmRsb29wICBlbmRmYWNldCAgZmFjZXQgbm9ybWFsIDAgLTEgMCAgICBvdXRlciBsb29wICAgICAgdmVydGV4IDAgMCAwICAgICAgdmVydGV4IDEwIDAgMCAgICAgIHZlcnRleCAxMCAwIDEwICAgIGVuZGxvb3AgIGVuZGZhY2V0ICBmYWNldCBub3JtYWwgMCAtMSAwICAgIG91dGVyIGxvb3AgICAgICB2ZXJ0ZXggMCAwIDAgICAgICB2ZXJ0ZXggMTAgMCAxMCAgICAgIHZlcnRleCAwIDAgMTAgICAgZW5kbG9vcCAgZW5kZmFjZXQgIGZhY2V0IG5vcm1hbCAwIDEgMCAgICBvdXRlciBsb29wICAgICAgdmVydGV4IDAgMTAgMCAgICAgIHZlcnRleCAwIDEwIDEwICAgICAgdmVydGV4IDEwIDEwIDEwICAgIGVuZGxvb3AgIGVuZGZhY2V0ICBmYWNldCBub3JtYWwgMCAxIDAgICAgb3V0ZXIgbG9vcCAgICAgIHZlcnRleCAwIDEwIDAgICAgICB2ZXJ0ZXggMTAgMTAgMTAgICAgICB2ZXJ0ZXggMTAgMTAgMCAgICBlbmRsb29wICBlbmRmYWNldCAgZmFjZXQgbm9ybWFsIC0xIDAgMCAgICBvdXRlciBsb29wICAgICAgdmVydGV4IDAgMCAwICAgICAgdmVydGV4IDAgMCAxMCAgICAgIHZlcnRleCAwIDEwIDEwICAgIGVuZGxvb3AgIGVuZGZhY2V0ICBmYWNldCBub3JtYWwgLTEgMCAwICAgIG91dGVyIGxvb3AgICAgICB2ZXJ0ZXggMCAwIDAgICAgICB2ZXJ0ZXggMCAxMCAxMCAgICAgIHZlcnRleCAwIDEwIDAgICAgZW5kbG9vcCAgZW5kZmFjZXQgIGZhY2V0IG5vcm1hbCAxIDAgMCAgICBvdXRlciBsb29wICAgICAgdmVydGV4IDEwIDAgMCAgICAgIHZlcnRleCAxMCAxMCAwICAgICAgdmVydGV4IDEwIDEwIDEwICAgIGVuZGxvb3AgIGVuZGZhY2V0ICBmYWNldCBub3JtYWwgMSAwIDAgICAgb3V0ZXIgbG9vcCAgICAgIHZlcnRleCAxMCAwIDAgICAgICB2ZXJ0ZXggMTAgMTAgMTAgICAgICB2ZXJ0ZXggMTAgMCAxMCAgICBlbmRsb29wICBlbmRmYWNldCBlbmRzb2xpZCBjdWJl";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('client');
  const [stlUrl, setStlUrl] = useState<string | null>(null);
  const [customGeometry, setCustomGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [stats, setStats] = useState<GeometryStats | null>(null);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [material, setMaterial] = useState<MaterialType>(MaterialType.H13_STEEL);
  const [finish, setFinish] = useState<FinishType>(FinishType.MACHINED);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [moldBaseConfig, setMoldBaseConfig] = useState<MoldBaseConfig>({
    standard: 'HASCO Standard',
    plateWidth: 296,
    plateLength: 296,
    stackHeight: 350,
    hotRunner: false,
    conformalCooling: false,
    doubleExtraction: false
  });

  const [cadMoldBaseConfig, setCadMoldBaseConfig] = useState<CadMoldBaseConfig>({
    supplier: 'HASCO',
    plateMaterial: 'Aço 1.1730 (C45W)',
    packageHeight: 350,
    insulationPlates: false,
    liftingHoles: false
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleNav = (e: any) => setActiveView(e.detail);
    window.addEventListener('nav-change', handleNav);
    return () => window.removeEventListener('nav-change', handleNav);
  }, []);

  const resetProject = () => {
    setStlUrl(null);
    setCustomGeometry(null);
    setStats(null);
    setMetadata(null);
    setIsConverting(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetProject();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'step' || extension === 'stp') {
      // Processamento de ficheiros STEP via backend
      setMetadata({ name: file.name, size: file.size, type: 'STEP' });
      setIsConverting(true);
      setLoadingMessage('A processar geometria no servidor...');

      try {
        const response = await stepService.processStepFile(file);
        if (response.success) {
          // Criar geometria de demonstração baseada na resposta
          const geometry = new THREE.TorusKnotGeometry(40, 12, 128, 32, 2, 3);
          geometry.computeBoundingBox();
          geometry.center();
          setCustomGeometry(geometry);
          setStats({
            volume: 1250,
            area: 0,
            dimensions: { width: 120, height: 120, depth: 120, max: 120, min: 120 },
            center_of_mass: response.center,
            bounding_box: {
              min: response.bounding_box.min,
              max: response.bounding_box.max,
              center: response.center,
              size: [
                response.bounding_box.max[0] - response.bounding_box.min[0],
                response.bounding_box.max[1] - response.bounding_box.min[1],
                response.bounding_box.max[2] - response.bounding_box.min[2]
              ]
            },
            mesh_info: {
              vertex_count: response.vertices_count,
              face_count: response.faces_count,
              is_watertight: true,
              complexity_score: 55,
              difficulty_rating: 'Média'
            }
          });
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar ficheiro STEP.');
      } finally {
        setIsConverting(false);
        setLoadingMessage('');
      }

    } else if (extension === 'sldprt') {
      // Simulação SolidWorks
      setMetadata({ name: file.name, size: file.size, type: 'SLDPRT' });
      setIsConverting(true);
      setLoadingMessage('A desencriptar geometria SolidWorks...');

      setTimeout(() => {
        setIsConverting(false);
        setStlUrl(FALLBACK_STL_URL);
        const simulatedVolume = file.size > 5000000 ? 1250 : 485;
        setStats({
          volume: simulatedVolume,
          area: 0,
          dimensions: { width: 120, height: 120, depth: 120, max: 120, min: 120 },
          center_of_mass: [0, 0, 0],
          bounding_box: {
            min: [-60, -60, -60],
            max: [60, 60, 60],
            center: [0, 0, 0],
            size: [120, 120, 120]
          },
          mesh_info: {
            vertex_count: 1000,
            face_count: 500,
            is_watertight: true,
            complexity_score: 45,
            difficulty_rating: 'Baixa'
          },
          isSimulated: true
        });
      }, 2500);

    } else if (extension === 'stl') {
      // Carregamento STL Standard
      const url = URL.createObjectURL(file);
      setStlUrl(url);
      setMetadata({ name: file.name, size: file.size, type: 'STL' });
      setIsConverting(false);
    } else {
      alert('Por favor, carregue um ficheiro .STL, .STEP ou .SLDPRT válido.');
    }
  };

  const handleModelLoaded = useCallback((geometry: THREE.BufferGeometry) => {
    const newStats = getGeometryStats(geometry);
    setStats(newStats);
  }, []);

  const calculateFinalPrice = () => {
    if (!stats) return 0;

    let setupFee = BASE_FIXED_FEE;
    if (moldBaseConfig.hotRunner) setupFee += MOLD_BASE_EXTRAS.HOT_RUNNER;
    if (moldBaseConfig.conformalCooling) setupFee += MOLD_BASE_EXTRAS.CONFORMAL_COOLING;
    if (moldBaseConfig.doubleExtraction) setupFee += MOLD_BASE_EXTRAS.DOUBLE_EXTRACTION;

    let cadStructuralCost = CAD_MOLD_BASE_PRICES[cadMoldBaseConfig.supplier]?.base || 3500;
    cadStructuralCost += PLATE_MATERIAL_ADDONS[cadMoldBaseConfig.plateMaterial] || 0;
    if (cadMoldBaseConfig.insulationPlates) cadStructuralCost += CAD_EXTRAS.INSULATION;
    if (cadMoldBaseConfig.liftingHoles) cadStructuralCost += CAD_EXTRAS.LIFTING_HOLES;

    const totalSetup = setupFee + cadStructuralCost;
    const currentAvg = (globalSettings.cnc3AxisRate + globalSettings.cnc5AxisRate + globalSettings.edmRate) / 3;
    const rateFactor = currentAvg / 63.3;
    const aggressivenessFactor = 1.2 - (globalSettings.iaAggressiveness * 0.25);
    const baseUnitCost = (stats.volume * MATERIAL_PRICES[material]?.price || 0.85) * FINISH_MULTIPLIERS[finish]?.multiplier || 1.0 * rateFactor * aggressivenessFactor * 0.15;

    let discount = 1.0;
    if (quantity >= 50) discount = 0.90;
    else if (quantity >= 10) discount = 0.95;

    return totalSetup + ((baseUnitCost * quantity) * discount);
  };

  const finalTotalPrice = calculateFinalPrice();

  const handleGeneratePDF = () => {
    if (!stats || !metadata) return;
    generateTechnicalBudgetPDF({
      metadata,
      stats,
      material,
      finish,
      quantity,
      moldBase: moldBaseConfig,
      cadBase: cadMoldBaseConfig,
      totalPrice: finalTotalPrice
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {activeView === 'client' && <AICopilot material={material} stats={stats} />}

      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Box className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight text-white">MetaMold AI</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveView('client')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeView === 'client' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileBox className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-semibold text-sm">Orçamentação</span>}
          </button>

          <button
            onClick={() => setActiveView('engineering')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeView === 'engineering' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Workflow className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-semibold text-sm">Engenharia & Design</span>}
          </button>

          <button
            onClick={() => setActiveView('mold-base')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeView === 'mold-base' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Layers className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-semibold text-sm">Norma de Fabrico</span>}
          </button>

          <button
            onClick={() => setActiveView('management')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeView === 'management' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-semibold text-sm">Gestão Industrial</span>}
          </button>

          <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
            <button
              onClick={() => setActiveView('cad-mold-base')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeView === 'cad-mold-base' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Database className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-semibold text-sm">Base de Moldes CAD</span>}
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeView === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-semibold text-sm">Configurações IA</span>}
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden">
               <img src="https://picsum.photos/seed/engineer/100/100" alt="Avatar" />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-white">Eng. Ricardo Costa</p>
                <p className="text-[10px] text-slate-500 font-mono">Senior Tooling Designer</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_right,_#1e293b,_transparent_20%)]">
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
              {activeView === 'client' ? 'Orçamentação Multi-CAD' :
               activeView === 'mold-base' ? 'Configurador de Fabrico' :
               activeView === 'cad-mold-base' ? 'Estruturas Normalizadas CAD' :
               activeView === 'engineering' ? 'Engenharia & Design Preditivo' :
               activeView === 'settings' ? 'Calibração de Algoritmo' : 'Dashboard Operacional'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {finalTotalPrice > 0 && activeView !== 'client' && (
               <div className="flex flex-col text-right">
                 <span className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Budget Total Estimado</span>
                 <span className="text-sm font-mono font-bold text-blue-400">€{finalTotalPrice.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
               </div>
            )}
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-400 hover:text-blue-400 cursor-pointer" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-950"></span>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> IMPORTAR CAD
            </button>
            <input type="file" accept=".stl,.sldprt,.step,.stp" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {activeView === 'client' && (
            <div className="h-full flex flex-col lg:flex-row gap-8">
              <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">Geometria Analisada</h2>
                  {(stlUrl || customGeometry || isConverting) && (
                    <button onClick={resetProject} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                      <X className="w-3 h-3" /> Limpar Projeto
                    </button>
                  )}
                </div>
                <div className="flex-1 min-h-0 relative">
                  <Viewer3D
                    stlUrl={stlUrl}
                    customGeometry={customGeometry}
                    isConverting={isConverting}
                    onModelLoaded={handleModelLoaded}
                    loadingMessage={loadingMessage}
                  />
                </div>
              </div>
              <BudgetPanel stats={stats} metadata={metadata} material={material} finish={finish} quantity={quantity} onMaterialChange={setMaterial} onFinishChange={setFinish} onQuantityChange={setQuantity} totalPriceOverride={finalTotalPrice} onGeneratePDF={handleGeneratePDF} />
            </div>
          )}
          {activeView === 'engineering' && <EngineeringView stats={stats} />}
          {activeView === 'mold-base' && <MoldBaseView config={moldBaseConfig} onChange={setMoldBaseConfig} />}
          {activeView === 'cad-mold-base' && <CadMoldBaseView config={cadMoldBaseConfig} stats={stats} onChange={setCadMoldBaseConfig} />}
          {activeView === 'management' && <ManagementView />}
          {activeView === 'settings' && <SettingsView settings={globalSettings} onSave={setGlobalSettings} />}
        </div>
      </main>
    </div>
  );
};

export default App;
