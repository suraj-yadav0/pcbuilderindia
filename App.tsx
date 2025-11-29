import React, { useState, useEffect } from 'react';
import { PartType, BuildState, ComponentData, CompatibilityResult } from './types';
import ComponentList from './components/ComponentList';
import VisualBuilder from './components/VisualBuilder';
import { checkCompatibility } from './services/geminiService';
import { 
  Cpu, CircuitBoard, MemoryStick, Monitor, HardDrive, Zap, Box, Fan, 
  ShoppingCart, AlertTriangle, CheckCircle, BarChart3, RotateCcw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const INITIAL_BUILD: BuildState = {};

// Simple map for icons
const ICONS: Record<PartType, React.ElementType> = {
  [PartType.CPU]: Cpu,
  [PartType.MOTHERBOARD]: CircuitBoard,
  [PartType.RAM]: MemoryStick,
  [PartType.GPU]: Monitor,
  [PartType.STORAGE]: HardDrive,
  [PartType.PSU]: Zap,
  [PartType.CASE]: Box,
  [PartType.COOLER]: Fan,
};

function App() {
  const [build, setBuild] = useState<BuildState>(INITIAL_BUILD);
  const [activeCategory, setActiveCategory] = useState<PartType>(PartType.CPU);
  const [analysis, setAnalysis] = useState<CompatibilityResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Computed totals with strict type filtering
  const activeParts = Object.values(build).filter((p): p is ComponentData => !!p);
  const totalPrice = activeParts.reduce((sum, part) => sum + (part.price || 0), 0);
  
  const handleAddPart = (part: ComponentData) => {
    setBuild(prev => ({ ...prev, [part.type]: part }));
    // Auto advance to next logical category
    const order = [
        PartType.CPU, PartType.MOTHERBOARD, PartType.RAM, PartType.GPU, 
        PartType.STORAGE, PartType.COOLER, PartType.PSU, PartType.CASE
    ];
    const currentIndex = order.indexOf(part.type);
    if (currentIndex < order.length - 1) {
        setActiveCategory(order[currentIndex + 1]);
    }
  };

  const handleRemovePart = (type: PartType) => {
    setBuild(prev => {
        const next = { ...prev };
        delete next[type];
        return next;
    });
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setShowAnalysis(true);
    const result = await checkCompatibility(build);
    setAnalysis(result);
    setAnalyzing(false);
  };

  // Chart Data Preparation
  const chartData = activeParts.map(part => ({
    name: part.type,
    value: part.price
  })).filter(x => x.value);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#10b981', '#f59e0b', '#84cc16'];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Left Sidebar - Categories */}
      <nav className="w-20 flex flex-col items-center py-6 bg-slate-950 border-r border-slate-800 z-20">
        <div className="mb-8 font-black text-2xl text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-indigo-500 tracking-tighter">
            IPC
        </div>
        <div className="flex-1 space-y-4 w-full px-2">
            {Object.values(PartType).map((type) => {
                const Icon = ICONS[type];
                const isActive = activeCategory === type;
                const hasItem = !!build[type];
                return (
                    <button
                        key={type}
                        onClick={() => setActiveCategory(type)}
                        className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative
                            ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}
                        `}
                        title={type}
                    >
                        <Icon className={`w-6 h-6 ${isActive ? 'animate-bounce-short' : ''}`} />
                        {hasItem && (
                            <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-950"></div>
                        )}
                    </button>
                )
            })}
        </div>
        <button className="mt-auto text-slate-500 hover:text-slate-300">
            <RotateCcw className="w-5 h-5" onClick={() => setBuild({})} />
        </button>
      </nav>

      {/* Panel 2: Product Selector */}
      <div className="w-[350px] h-full z-10 shadow-2xl">
        <ComponentList 
            selectedCategory={activeCategory} 
            onSelect={handleAddPart}
            currentBudget={0}
            build={build}
        />
      </div>

      {/* Main Area: Visualizer & Stats */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md z-10">
            <h1 className="text-xl font-medium tracking-wide">
                IndiPC <span className="font-light text-slate-400">Builder</span>
            </h1>
            
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Total Estimate</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">₹{totalPrice.toLocaleString()}</span>
                </div>
                
                <button 
                    onClick={runAnalysis}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <BarChart3 className="w-4 h-4" />
                    {analyzing ? 'Analyzing...' : 'Check Compatibility'}
                </button>
            </div>
        </header>

        {/* Builder Canvas */}
        <div className="flex-1 relative">
            <VisualBuilder build={build} onRemove={handleRemovePart} />
        </div>

        {/* Bottom Bar: Quick Stats */}
        {activeParts.length > 0 && (
             <div className="absolute bottom-8 left-8 right-8 h-24 glass-panel rounded-2xl flex items-center justify-between px-8 animate-fade-in-up">
                <div className="flex gap-8">
                    {/* Tiny Chart */}
                    <div className="w-24 h-24 -my-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xs text-slate-400 uppercase font-bold">Components</span>
                        <span className="text-lg font-semibold">{activeParts.length}/8 Selected</span>
                    </div>
                </div>

                <button className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl hover:bg-emerald-600/30 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Buy from Amazon.in</span>
                </button>
             </div>
        )}

        {/* AI Analysis Modal Overlay */}
        {showAnalysis && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-10">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="text-yellow-400 w-5 h-5" /> AI Build Analysis
                        </h2>
                        <button onClick={() => setShowAnalysis(false)} className="text-slate-400 hover:text-white">Close</button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto">
                        {analyzing ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-indigo-300 animate-pulse">Running Gemini diagnostics...</p>
                            </div>
                        ) : analysis ? (
                            <div className="space-y-6">
                                {/* Score */}
                                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div>
                                        <p className="text-sm text-slate-400">AI Compatibility Score</p>
                                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                            {analysis.aiScore}/100
                                        </p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg border ${analysis.isCompatible ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}>
                                        {analysis.isCompatible ? 'Compatible Build' : 'Issues Found'}
                                    </div>
                                </div>

                                {/* Wattage */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800 rounded-lg">
                                        <span className="text-xs text-slate-500 uppercase">Est. Wattage</span>
                                        <div className="text-xl font-mono text-yellow-400">{analysis.estimatedWattage}W</div>
                                    </div>
                                    <div className="p-4 bg-slate-800 rounded-lg">
                                        <span className="text-xs text-slate-500 uppercase">Bottleneck</span>
                                        <div className="text-sm font-medium text-slate-300">{analysis.bottleneck || "None detected"}</div>
                                    </div>
                                </div>

                                {/* Issues List */}
                                {analysis.issues.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-red-400 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Critical Issues
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300 bg-red-900/10 p-4 rounded-lg border border-red-900/30">
                                            {analysis.issues.map((issue, i) => (
                                                <li key={i}>{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Notes */}
                                {analysis.notes.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-indigo-400 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> AI Recommendations
                                        </h3>
                                        <ul className="space-y-2 text-sm text-slate-400">
                                            {analysis.notes.map((note, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-red-500 text-center">Analysis failed.</div>
                        )}
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;