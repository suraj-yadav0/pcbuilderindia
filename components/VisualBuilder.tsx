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
        className={`absolute transition-all duration-500 ${coords.class} ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-80'}`}
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
            ? 'border-cyan-400 bg-cyan-900/40 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
            : 'border-slate-700 bg-slate-800/30 text-slate-600 border-dashed hover:border-slate-500'}
          rounded-lg backdrop-blur-sm cursor-pointer overflow-hidden
          transition-all duration-300
        `}>
          
          {/* Active State Content */}
          {isActive ? (
             <div className="text-center p-2 w-full animate-in zoom-in fade-in duration-300">
                <Icon className="w-6 h-6 mx-auto mb-1 text-cyan-400 drop-shadow-md" />
                <span className="text-[10px] font-bold leading-tight block truncate w-full px-1">{part.name}</span>
                <span className="text-[9px] text-cyan-200 bg-cyan-900/50 px-2 py-0.5 rounded-full mt-1 inline-block">
                    ₹{part.price.toLocaleString()}
                </span>
                {/* Tech scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent translate-y-[-100%] animate-[scan_3s_infinite] pointer-events-none"></div>
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
    // Center points of components for drawing lines
    const centers: Partial<Record<PartType, {x: number, y: number}>> = {};
    Object.entries(COMPONENT_COORDS).forEach(([key, coords]) => {
        centers[key as PartType] = {
            x: coords.x + coords.width / 2,
            y: coords.y + coords.height / 2
        };
    });

    const connections = [];

    // PSU to Motherboard (24-pin)
    if (build[PartType.PSU] && build[PartType.MOTHERBOARD]) {
        connections.push({ from: centers[PartType.PSU]!, to: centers[PartType.MOTHERBOARD]!, color: '#22d3ee', id: 'psu-mobo' });
    }
    // PSU to GPU (PCIe Power)
    if (build[PartType.PSU] && build[PartType.GPU]) {
        connections.push({ from: centers[PartType.PSU]!, to: centers[PartType.GPU]!, color: '#facc15', id: 'psu-gpu' });
    }
    // Motherboard to RAM (Data Bus - abstract)
    if (build[PartType.MOTHERBOARD] && build[PartType.RAM]) {
        connections.push({ from: centers[PartType.CPU]!, to: centers[PartType.RAM]!, color: '#a78bfa', id: 'cpu-ram' });
    }
    // Motherboard to Storage (SATA)
    if (build[PartType.MOTHERBOARD] && build[PartType.STORAGE]) {
        connections.push({ from: { x: centers[PartType.MOTHERBOARD]!.x + 50, y: centers[PartType.MOTHERBOARD]!.y + 100 }, to: centers[PartType.STORAGE]!, color: '#34d399', id: 'mobo-sata' });
    }

    return connections.map(conn => (
        <g key={conn.id}>
            <path 
                d={`M ${conn.from.x} ${conn.from.y} C ${conn.from.x} ${conn.from.y - 50}, ${conn.to.x} ${conn.to.y + 50}, ${conn.to.x} ${conn.to.y}`}
                fill="none"
                stroke={conn.color}
                strokeWidth="2"
                strokeDasharray="10"
                className="opacity-60 animate-[dash_20s_linear_infinite]"
            />
            <circle cx={conn.from.x} cy={conn.from.y} r="3" fill={conn.color} className="animate-pulse" />
            <circle cx={conn.to.x} cy={conn.to.y} r="3" fill={conn.color} className="animate-pulse" />
        </g>
    ));
  }, [build]);

  return (
    <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden relative select-none">
        
        {/* Style injection for custom keyframes that Tailwind config doesn't cover easily */}
        <style>{`
            @keyframes scan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(200%); }
            }
            @keyframes dash {
                to { stroke-dashoffset: -1000; }
            }
        `}</style>

        {/* The Case Container */}
        <div className="relative w-[500px] h-[600px] bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-2xl p-4 overflow-hidden transform transition-transform duration-700 hover:scale-[1.02]">
            
            {/* Background Texture/Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            
            {/* SVG Connection Layer */}
            <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                {renderConnections}
            </svg>

            {/* Motherboard PCB Visual (Static Background) */}
            <div className="absolute top-[20px] left-[20px] w-[380px] h-[440px] bg-slate-800/50 rounded border border-slate-700/50 z-0">
                 <CircuitBoard className="absolute bottom-4 right-4 w-24 h-24 text-slate-700/20" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-slate-700/30"></div>
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
        
        <div className="absolute bottom-4 left-0 w-full text-center text-slate-500 text-xs tracking-widest uppercase">
            Interactive Cabinet View • Click installed part to remove
        </div>
    </div>
  );
};

export default VisualBuilder;