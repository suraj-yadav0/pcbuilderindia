import React, { useState, useEffect } from 'react';
import { PartType, ComponentData } from '../types';
import { fetchComponents } from '../services/geminiService';
import { Search, Plus, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface ComponentListProps {
  selectedCategory: PartType;
  onSelect: (part: ComponentData) => void;
  currentBudget: number;
}

const ComponentList: React.FC<ComponentListProps> = ({ selectedCategory, onSelect, currentBudget }) => {
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
  }, [selectedCategory]); // Reload when category changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
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
            items.map((part) => (
                <div key={part.id} className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-3 transition-all">
                    <div className="flex gap-3">
                        <img src={part.image} alt={part.name} className="w-16 h-16 object-cover rounded bg-slate-900" />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-200 truncate pr-6">{part.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-cyan-400 font-mono font-bold">₹{part.price.toLocaleString()}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{part.retailer}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                                <span>⭐ {part.rating}</span>
                                {Object.values(part.specs).slice(0, 1).map((s, i) => (
                                    <span key={i} className="truncate max-w-[80px]">• {s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSelect(part)}
                        className="absolute bottom-3 right-3 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Add to Build"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    
                    <a 
                        href="#" 
                        onClick={(e) => e.preventDefault()} 
                        className="absolute top-3 right-3 text-slate-500 hover:text-cyan-400"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ComponentList;
