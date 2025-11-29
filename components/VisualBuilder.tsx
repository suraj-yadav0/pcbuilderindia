import React, { useMemo } from 'react';
import { BuildState, PartType } from '../types';
import { Cpu, CircuitBoard, MemoryStick, HardDrive, Fan, Box, Monitor, Zap } from 'lucide-react';

interface VisualBuilderProps {
  build: BuildState;
  onRemove: (type: PartType) => void;
}

// Define coordinates for the 500x600 container
const COMPONENT_COORDS: Record<PartType, { x: number; y: number; width: number; height: number; class: string }> = {
  [PartType.MOTHERBOARD]: { x: 20, y: 20, width: 380, height: 440, class: 'z-0 opacity-40' }, // Base layer
  [PartType.CPU]: { x: 168, y: 110, width: 80, height: 80, class: 'z-30' },
  [PartType.COOLER]: { x: 168, y: 110, width: 80, height: 80, class: 'z-40' }, // On top of CPU
  [PartType.RAM]: { x: 300, y: 110, width: 32, height: 128, class: 'z-30' },
  [PartType.GPU]: { x: 64, y: 240, width: 256, height: 128, class: 'z-30' },
  [PartType.PSU]: { x: 30, y: 480, width: 160, height: 96, class: 'z-30' },
  [PartType.STORAGE]: { x: 380, y: 420, width: 96, height: 64, class: 'z-30' },
  [PartType.CASE]: { x: 0, y: 0, width: 500, height: 600, class: 'z-0 hidden' }, // Handled by container
};

const VisualBuilder: React.FC<VisualBuilderProps> = ({ build, onRemove }) => {
  const getPart = (type: PartType) => build[type];

  // Helper to render a slot
  const renderSlot = (type: PartType, Icon: React.ElementType) => {
    const part = getPart(type);
    const isActive = !!part;
    const coords = COMPONENT_COORDS[type];

    if (!coords) return null;

    return (
      <div 
        key={type}
        className={`absolute transition-all duration-500 ease-out ${coords.class} ${isActive ? 'scale-100 opacity-100 z-50' : 'scale-95 opacity-80 z-10'}`}
        style={{ 
            top: `${coords.y}px`, 
            left: `${coords.x}px`, 
            width: `${coords.width}px`, 
            height: `${coords.height}px` 
        }}
        onClick={() => isActive && onRemove(type)}
        title={part ? `${part.name} (Click to remove)` : `Empty ${type} Slot`}
      >
        <div className={`
          relative w-full h-full flex items-center justify-center border-2 
          ${isActive 
            ? 'border-cyan-400 bg-cyan-900/80 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.4)] ring-1 ring-cyan-300/50' 
            : 'border-slate-700 bg-slate-800/30 text-slate-600 border-dashed hover:border-slate-500 hover:bg-slate-800/50'}
          rounded-lg backdrop-blur-sm cursor-pointer overflow-hidden
          transition-all duration-300
        `}>
          
          {/* Active State Content */}
          {isActive ? (
             <div className="text-center p-2 w-full animate-[zoomIn_0.4s_ease-out]">
                <Icon className="w-8 h-8 mx-auto mb-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] font-bold leading-tight block truncate w-full px-1">{part.name}</span>
                <span className="text-[9px] text-cyan-200 bg-cyan-950/60 px-2 py-0.5 rounded-full mt-1 inline-block border border-cyan-500/30">
                    ₹{part.price.toLocaleString()}
                </span>
                
                {/* Tech scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent translate-y-[-100%] animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-500"></div>
             </div>
          ) : (
            /* Empty State Content */
            <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider">{type}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Connection Lines Logic
  const renderConnections = useMemo(() => {
    const centers: Partial<Record<PartType, {x: number, y: number}>> = {};
    Object.entries(COMPONENT_COORDS).forEach(([key, coords]) => {
        centers[key as PartType] = {
            x: coords.x + coords.width / 2,
            y: coords.y + coords.height / 2
        };
    });

    const connections = [];

    // Helper for Orthogonal Path (Manhattan routing)
    const getOrthoPath = (start: {x:number, y:number}, end: {x:number, y:number}) => {
        // Simple Step Routing: Vertical then Horizontal
        const midY = (start.y + end.y) / 2;
        return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    }

    // PSU to Motherboard (24-pin)
    if (build[PartType.PSU] && build[PartType.MOTHERBOARD]) {
        connections.push({ path: getOrthoPath(centers[PartType.PSU]!, centers[PartType.MOTHERBOARD]!), color: 'url(#grad-power)', id: 'psu-mobo', glow: '#22d3ee' });
    }
    // PSU to GPU (PCIe Power)
    if (build[PartType.PSU] && build[PartType.GPU]) {
        connections.push({ path: getOrthoPath(centers[PartType.PSU]!, centers[PartType.GPU]!), color: 'url(#grad-power-gpu)', id: 'psu-gpu', glow: '#facc15' });
    }
    // CPU to RAM (Data Bus)
    if (build[PartType.CPU] && build[PartType.RAM]) {
        connections.push({ path: `M ${centers[PartType.CPU]!.x} ${centers[PartType.CPU]!.y} L ${centers[PartType.RAM]!.x} ${centers[PartType.RAM]!.y}`, color: 'url(#grad-data)', id: 'cpu-ram', glow: '#a78bfa' });
    }
    // CPU to GPU (PCIe Lanes)
    if (build[PartType.CPU] && build[PartType.GPU]) {
         // Custom path for visual clarity
         const start = centers[PartType.CPU]!;
         const end = centers[PartType.GPU]!;
         const path = `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
         connections.push({ path, color: 'url(#grad-data)', id: 'cpu-gpu', glow: '#a78bfa' });
    }
    // Motherboard to Storage (SATA)
    if (build[PartType.MOTHERBOARD] && build[PartType.STORAGE]) {
        const start = { x: centers[PartType.MOTHERBOARD]!.x + 60, y: centers[PartType.MOTHERBOARD]!.y + 120 };
        const end = centers[PartType.STORAGE]!;
        const path = `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
        connections.push({ path, color: '#34d399', id: 'mobo-sata', glow: '#34d399' });
    }

    return connections.map(conn => (
        <g key={conn.id} className="animate-[fadeIn_0.5s_ease-out]">
            {/* Glow Effect Layer */}
            <path 
                d={conn.path}
                fill="none"
                stroke={conn.glow}
                strokeWidth="4"
                className="opacity-20 blur-sm"
            />
            {/* Core Line Layer */}
            <path 
                d={conn.path}
                fill="none"
                stroke={conn.color}
                strokeWidth="2"
                className="opacity-80"
            />
            {/* Traveling Packet Animation */}
            <circle r="3" fill="white">
                <animateMotion 
                    dur="2s" 
                    repeatCount="indefinite" 
                    path={conn.path}
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                />
            </circle>
        </g>
    ));
  }, [build]);

  return (
    <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden relative select-none">
        
        <style>{`
            @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(200%); }
            }
            @keyframes zoomIn {
                0% { opacity: 0; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
        `}</style>

        {/* The Case Container */}
        <div className="relative w-[500px] h-[600px] bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-2xl p-4 overflow-hidden transform transition-transform duration-700 hover:scale-[1.02]">
            
            {/* Background Texture/Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            
            {/* SVG Connection Layer */}
            <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                <defs>
                    <linearGradient id="grad-power" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0891b2" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="grad-power-gpu" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#eab308" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#facc15" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="grad-data" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="1" />
                    </linearGradient>
                </defs>
                {renderConnections}
            </svg>

            {/* Motherboard PCB Visual (Static Background) */}
            <div className="absolute top-[20px] left-[20px] w-[380px] h-[440px] bg-slate-800/50 rounded border border-slate-700/50 z-0">
                 <CircuitBoard className="absolute bottom-4 right-4 w-24 h-24 text-slate-700/20" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-slate-700/30"></div>
                 {/* PCI Lanes Decor */}
                 <div className="absolute bottom-20 left-10 w-40 h-2 bg-slate-700/30 rounded"></div>
                 <div className="absolute bottom-16 left-10 w-40 h-2 bg-slate-700/30 rounded"></div>
            </div>

            {/* Component Slots */}
            {renderSlot(PartType.CPU, Cpu)}
            {renderSlot(PartType.COOLER, Fan)}
            {renderSlot(PartType.RAM, MemoryStick)}
            {renderSlot(PartType.GPU, Monitor)}
            {renderSlot(PartType.STORAGE, HardDrive)}
            {renderSlot(PartType.PSU, Zap)}
            
            {/* Decorative Fans (Visual Only) */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-slate-700 flex items-center justify-center animate-[spin_4s_linear_infinite] opacity-20 z-0">
                <Fan className="w-16 h-16 text-slate-600" />
            </div>
            <div className="absolute bottom-40 left-[-10px] w-20 h-20 rounded-full border border-slate-700 flex items-center justify-center animate-[spin_5s_linear_infinite] opacity-10 z-0">
                <Fan className="w-16 h-16 text-slate-600" />
            </div>

            {/* Glass Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-50 rounded-2xl"></div>
            
            {/* Case Badge */}
            <div className="absolute bottom-6 right-6 z-10 opacity-30">
                <Box className="w-8 h-8 text-slate-500" />
            </div>

        </div>
        
        <div className="absolute bottom-4 left-0 w-full text-center text-slate-500 text-xs tracking-widest uppercase animate-pulse">
            System Live • Connections Active
        </div>
    </div>
  );
};

export default VisualBuilder;