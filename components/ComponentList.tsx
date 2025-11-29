import React, { useState, useEffect } from 'react';
import { PartType, ComponentData, BuildState } from '../types';
import { fetchComponents } from '../services/geminiService';
import { Search, Plus, ExternalLink, RefreshCw, AlertCircle, Check, AlertTriangle } from 'lucide-react';

interface ComponentListProps {
  selectedCategory: PartType;
  onSelect: (part: ComponentData) => void;
  currentBudget: number;
  build: BuildState;
}

const ComponentList: React.FC<ComponentListProps> = ({ selectedCategory, onSelect, build }) => {
  const [items, setItems] = useState<ComponentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComponents(selectedCategory, search);
      setItems(data);
    } catch (err) {
      setError("Failed to load components. Please check API Key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  // Helper to determine relevant specs to display based on category
  const getRelevantSpecs = (part: ComponentData) => {
    const specs = part.specs || {};
    const relevant: { label: string; value: string }[] = [];

    switch (part.type) {
        case PartType.CPU:
            if (specs.socket) relevant.push({ label: 'Socket', value: specs.socket });
            if (specs.speed) relevant.push({ label: 'Speed', value: specs.speed });
            if (specs.cores) relevant.push({ label: 'Cores', value: specs.cores || 'N/A' });
            break;
        case PartType.MOTHERBOARD:
            if (specs.socket) relevant.push({ label: 'Socket', value: specs.socket });
            if (specs.chipset) relevant.push({ label: 'Chipset', value: specs.chipset });
            if (specs.formFactor) relevant.push({ label: 'Form', value: specs.formFactor || 'ATX' });
            break;
        case PartType.RAM:
            if (specs.type) relevant.push({ label: 'Type', value: specs.type || 'DDR4/5' });
            if (specs.capacity) relevant.push({ label: 'Cap', value: specs.capacity });
            if (specs.speed) relevant.push({ label: 'Speed', value: specs.speed });
            break;
        case PartType.GPU:
            if (specs.memory) relevant.push({ label: 'VRAM', value: specs.memory || specs.capacity || 'N/A' });
            if (specs.chipset) relevant.push({ label: 'Chip', value: specs.chipset });
            break;
        case PartType.PSU:
            if (specs.wattage) relevant.push({ label: 'Power', value: specs.wattage });
            if (specs.rating) relevant.push({ label: 'Eff.', value: specs.rating || '80+' });
            break;
        default:
            // Fallback: take first 2 available keys
            Object.entries(specs).slice(0, 2).forEach(([k, v]) => {
                relevant.push({ label: k, value: v as string });
            });
    }
    return relevant;
  };

  // Logic to check immediate compatibility
  const getCompatibilityWarning = (part: ComponentData): string | null => {
    const specs = part.specs || {};
    
    // Check CPU vs Mobo Socket
    if (part.type === PartType.CPU && build[PartType.MOTHERBOARD]) {
        const moboSocket = build[PartType.MOTHERBOARD]?.specs.socket;
        const cpuSocket = specs.socket;
        if (moboSocket && cpuSocket && moboSocket !== cpuSocket) {
            return `Socket Mismatch: ${cpuSocket} vs ${moboSocket}`;
        }
    }
    if (part.type === PartType.MOTHERBOARD && build[PartType.CPU]) {
        const cpuSocket = build[PartType.CPU]?.specs.socket;
        const moboSocket = specs.socket;
        if (moboSocket && cpuSocket && moboSocket !== cpuSocket) {
            return `Socket Mismatch: ${moboSocket} vs ${cpuSocket}`;
        }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-slate-100 mb-1">{selectedCategory}</h2>
        <p className="text-xs text-slate-400">Aggregated from Amazon.in, MDComputers & more</p>
        
        <form onSubmit={handleSearch} className="mt-4 relative">
          <input 
            type="text" 
            placeholder={`Search ${selectedCategory}...`}
            className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:border-cyan-500 outline-none transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">AI is scraping listings...</p>
            </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-400 text-center">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-sm">{error}</p>
                <button onClick={loadItems} className="mt-2 text-xs underline">Retry</button>
            </div>
        ) : items.length === 0 ? (
            <p className="text-center text-slate-500 text-sm mt-10">No parts found.</p>
        ) : (
            items.map((part) => {
                const warning = getCompatibilityWarning(part);
                const relevantSpecs = getRelevantSpecs(part);
                
                return (
                    <div key={part.id} className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-3 transition-all">
                        <div className="flex gap-3 mb-2">
                            <img src={part.image} alt={part.name} className="w-16 h-16 object-cover rounded bg-slate-900" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-slate-200 truncate pr-6">{part.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-cyan-400 font-mono font-bold">₹{part.price.toLocaleString()}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{part.retailer}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-yellow-500">
                                    <span>{'★'.repeat(Math.round(part.rating || 0))}</span>
                                    <span className="text-slate-500 ml-1">({part.rating})</span>
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-1 mb-2">
                            {relevantSpecs.map((spec, i) => (
                                <div key={i} className="flex justify-between items-center bg-slate-900/50 px-2 py-1 rounded text-[10px]">
                                    <span className="text-slate-500 uppercase">{spec.label}</span>
                                    <span className="text-slate-300 font-mono truncate max-w-[80px] text-right" title={spec.value}>{spec.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Compatibility Warning Banner */}
                        {warning && (
                            <div className="mb-2 flex items-start gap-1.5 p-1.5 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-300">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{warning}</span>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => onSelect(part)}
                            className={`absolute bottom-3 right-3 p-1.5 text-white rounded-full shadow-lg transition-transform hover:scale-110 ${warning ? 'bg-orange-600 hover:bg-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                            title={warning ? "Add despite warning" : "Add to Build"}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        
                        <a 
                            href={part.url} 
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()} 
                            className="absolute top-3 right-3 text-slate-500 hover:text-cyan-400"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default ComponentList;