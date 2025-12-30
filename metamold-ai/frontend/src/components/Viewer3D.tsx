import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Loader2, UploadCloud, Cpu, RefreshCcw, Box } from 'lucide-react';

interface Viewer3DProps {
  stlUrl: string | null;
  customGeometry?: THREE.BufferGeometry | null;
  isConverting: boolean;
  onModelLoaded: (geometry: THREE.BufferGeometry) => void;
  loadingMessage?: string;
}

const LoadingOverlay = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700 backdrop-blur-sm w-48">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <span className="text-white font-medium text-xs">Renderização GPU</span>
        <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </Html>
  );
};

const ConversionOverlay = ({ message }: { message?: string }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + Math.random() * 8 : prev));
    }, 150);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="w-72 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-blue-400 uppercase tracking-tighter">
          <div className="flex items-center gap-2">
            <RefreshCcw className="w-3 h-3 animate-spin" />
            {message || 'A processar geometria...'}
          </div>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>MODULE: OPEN_CASCADE_WASM</span>
          <span>NURBS TESSELLATION</span>
        </div>
      </div>
    </div>
  );
};

const Model = ({ url, geometry, onLoaded }: { url: string | null; geometry?: THREE.BufferGeometry | null; onLoaded: (geo: THREE.BufferGeometry) => void }) => {
  const [loadedGeo, setLoadedGeo] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (geometry) {
      setLoadedGeo(geometry);
      onLoaded(geometry);
    } else if (url) {
      const loader = new STLLoader();
      loader.load(url, (geo) => {
        setLoadedGeo(geo);
        onLoaded(geo);
      });
    }
  }, [url, geometry, onLoaded]);

  if (!loadedGeo) return null;

  const Mesh = 'mesh' as any;
  const MeshPhysicalMaterial = 'meshPhysicalMaterial' as any;

  return (
    <Mesh geometry={loadedGeo} castShadow receiveShadow>
      <MeshPhysicalMaterial
        color="#e2e8f0"
        metalness={0.8}
        roughness={0.25}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        envMapIntensity={1.2}
        flatShading={false}
      />
    </Mesh>
  );
};

export const Viewer3D: React.FC<Viewer3DProps> = ({ stlUrl, customGeometry, isConverting, onModelLoaded, loadingMessage }) => {
  const hasContent = stlUrl || customGeometry;

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden group shadow-2xl">
      {isConverting && <ConversionOverlay message={loadingMessage} />}

      {!hasContent && !isConverting ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
          <div className="p-6 rounded-full bg-slate-800/50 mb-4 ring-1 ring-slate-700 group-hover:ring-blue-500 transition-all duration-300">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">Visualizador CAD Universal</h3>
          <p className="max-w-xs text-sm">Suporte nativo para:</p>
          <div className="flex gap-2 mt-3">
             <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold border border-slate-700">.STL</span>
             <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-[10px] font-bold border border-blue-500/30">.STEP</span>
             <span className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold border border-slate-700">.SLDPRT</span>
          </div>
        </div>
      ) : (
        <Canvas shadows camera={{ position: [100, 100, 100], fov: 45 }}>
          <Suspense fallback={<LoadingOverlay />}>
            <Stage environment="city" intensity={0.6} contactShadow={{ opacity: 0.4, blur: 2.5 }}>
              <Center>
                <Model url={stlUrl} geometry={customGeometry} onLoaded={onModelLoaded} />
              </Center>
            </Stage>
            <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
          </Suspense>
        </Canvas>
      )}

      {(hasContent || isConverting) && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-mono text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConverting ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            {isConverting ? 'Kernel CAD Ativo' : 'Visualização Engenharia'}
          </div>
          {!isConverting && (
            <div className="bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <Cpu className="w-3 h-3" />
              {customGeometry ? 'Geometria: Paramétrica (STEP)' : 'Geometria: Malha (STL)'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
