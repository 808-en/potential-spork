import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TerrainType, PresetDefinition, CustomAssetSettings, ProceduralSettings, AssetInstance } from '../types';
import { PRESETS } from '../presets';
import { playSound } from '../utils/audio';

interface SidebarProps {
  gridSize: number;
  selectedTool: 'select' | 'terrain' | 'asset' | 'erase-asset' | 'explore';
  selectedTerrain: TerrainType;
  selectedPreset: PresetDefinition | null;
  customPreset: AssetInstance | null;
  brushSize: number;
  collisionEnabled: boolean;
  lanternEnabled: boolean;
  proceduralSettings: ProceduralSettings;
  
  onSelectTool: (tool: 'select' | 'terrain' | 'asset' | 'erase-asset' | 'explore') => void;
  onSelectTerrain: (terrain: TerrainType) => void;
  onSelectPreset: (preset: PresetDefinition | null) => void;
  onSelectCustomPreset: (custom: AssetInstance | null) => void;
  onSetBrushSize: (size: number) => void;
  onToggleCollision: () => void;
  onToggleLantern: () => void;
  onUpdateProceduralSettings: (settings: ProceduralSettings) => void;
  onGenerateProcedural: () => void;
  onSaveMap: (name: string) => void;
  onLoadMap: () => void;
  onResetMap: () => void;
  saveSlotInfo: { savedAt: string; name: string; assetCount: number; tileCount: number } | null;
}

type TabType = 'painter' | 'presets' | 'custom' | 'procedural' | 'storage';

export const Sidebar: React.FC<SidebarProps> = ({
  gridSize,
  selectedTool,
  selectedTerrain,
  selectedPreset,
  customPreset,
  brushSize,
  collisionEnabled,
  lanternEnabled,
  proceduralSettings,
  onSelectTool,
  onSelectTerrain,
  onSelectPreset,
  onSelectCustomPreset,
  onSetBrushSize,
  onToggleCollision,
  onToggleLantern,
  onUpdateProceduralSettings,
  onGenerateProcedural,
  onSaveMap,
  onLoadMap,
  onResetMap,
  saveSlotInfo
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('painter');
  const [saveName, setSaveName] = useState<string>('My Bloxd Dark Forest');
  const [exportString, setExportString] = useState<string>('');
  
  // Custom Preset Builder state
  const [customSettings, setCustomSettings] = useState<CustomAssetSettings>({
    name: 'Glow Spire',
    symbol: '🗼',
    color: '#06b6d4',
    category: 'building',
    width: 2,
    height: 2,
    footprintType: 'solid',
    customOffsets: []
  });

  // Calculate coordinates footprint based on Custom Asset sizes
  const computeCustomOffsets = (settings: CustomAssetSettings): [number, number][] => {
    const offsets: [number, number][] = [];
    const { width, height, footprintType } = settings;
    
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (footprintType === 'solid') {
          offsets.push([r, c]);
        } else if (footprintType === 'cross') {
          // Center row or center column
          const midR = Math.floor(height / 2);
          const midC = Math.floor(width / 2);
          if (r === midR || c === midC) {
            offsets.push([r, c]);
          }
        } else if (footprintType === 'corners') {
          // Only four corners
          const isRowEdge = r === 0 || r === height - 1;
          const isColEdge = c === 0 || c === width - 1;
          if (isRowEdge && isColEdge) {
            offsets.push([r, c]);
          }
        }
      }
    }
    return offsets.length > 0 ? offsets : [[0, 0]];
  };

  const handleCreateCustomPreset = () => {
    playSound.click();
    const offsets = computeCustomOffsets(customSettings);
    const mockCustomAsset: AssetInstance = {
      id: 'custom-asset-preset',
      presetId: 'custom',
      name: customSettings.name,
      r: 0,
      c: 0,
      offsets,
      color: customSettings.color,
      symbol: customSettings.symbol,
      category: customSettings.category
    };
    onSelectCustomPreset(mockCustomAsset);
    onSelectPreset(null); // Deselect premade preset
    onSelectTool('asset');
  };

  const selectPresetHandler = (preset: PresetDefinition) => {
    playSound.click();
    onSelectPreset(preset);
    onSelectCustomPreset(null); // Deselect custom
    onSelectTool('asset');
  };

  const selectTerrainHandler = (terrain: TerrainType) => {
    playSound.click();
    onSelectTerrain(terrain);
    onSelectTool('terrain');
  };

  const toggleTab = (tab: TabType) => {
    playSound.click();
    setActiveTab(tab);
  };

  // Generate direct share/backup code from local storage
  const handleExportText = () => {
    playSound.click();
    const key = `bloxd_map_one_block_save`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setExportString(btoa(unescape(encodeURIComponent(saved))));
    } else {
      alert("Please save your map to local storage first before exporting!");
    }
  };

  // Load imported world text code
  const handleImportText = (code: string) => {
    if (!code) return;
    try {
      const decoded = decodeURIComponent(escape(atob(code.trim())));
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed.gridSize === 'number') {
        localStorage.setItem(`bloxd_map_one_block_save`, decoded);
        onLoadMap();
        setExportString('');
        playSound.generate();
      } else {
        alert("Invalid map code string format.");
      }
    } catch (e) {
      alert("Failed to parse map string. Make sure it is copied exactly.");
    }
  };

  return (
    <div className="w-full lg:w-96 flex flex-col bg-slate-950/95 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl h-full backdrop-blur-md">
      
      {/* HEADER SECTION */}
      <div className="p-5 border-b border-slate-800/60 bg-gradient-to-r from-emerald-950/40 to-slate-950">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌲</span>
          <div>
            <h1 className="text-md font-sans font-bold text-slate-100 tracking-tight leading-tight">
              Bloxd One-Block Planner
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              Dark Forest Theme Editor
            </p>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-800/80 text-xs font-mono select-none overflow-x-auto scrollbar-none">
        {(['painter', 'presets', 'custom', 'procedural', 'storage'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => toggleTab(tab)}
            className={`flex-1 py-3 px-1 text-center font-medium capitalize tracking-wide transition-all border-b-2 outline-none ${
              activeTab === tab
                ? 'text-emerald-400 border-emerald-500 bg-emerald-950/25'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {tab === 'painter' ? '🖌️ Paint' : 
             tab === 'presets' ? '📦 Presets' : 
             tab === 'custom' ? '🛠️ Custom' : 
             tab === 'procedural' ? '🌀 Auto-Gen' : '💾 File'}
          </button>
        ))}
      </div>

      {/* SCROLLABLE SIDEBAR CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* 1. PAINTER TAB */}
            {activeTab === 'painter' && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/40">
                  <h3 className="text-xs font-mono font-semibold text-emerald-400 mb-2 uppercase tracking-wide">
                    Tool Mode
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { playSound.click(); onSelectTool('terrain'); }}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-center gap-2 ${
                        selectedTool === 'terrain'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      🖌️ Paint Brush
                    </button>
                    <button
                      onClick={() => { playSound.click(); onSelectTool('erase-asset'); }}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-center gap-2 ${
                        selectedTool === 'erase-asset'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      🧽 Delete Asset
                    </button>
                    <button
                      onClick={() => { playSound.click(); onSelectTool('explore'); }}
                      className={`col-span-2 py-2 px-3 rounded-lg border text-xs font-mono transition-all flex items-center justify-center gap-2 ${
                        selectedTool === 'explore'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md animate-pulse'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      🏃 Live Explore Mode
                    </button>
                  </div>
                </div>

                {selectedTool === 'terrain' && (
                  <>
                    {/* Terrain Palette */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                        Terrain Materials
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'dark-grass', label: 'Dark Grass', desc: 'Mossy woodland floor', bg: 'bg-[#14532d]' },
                          { id: 'grass', label: 'Light Grass', desc: 'Clear forest sod', bg: 'bg-[#065f46]' },
                          { id: 'mossy-stone', label: 'Moss Stone', desc: 'Ruins construction', bg: 'bg-[#475569] border-emerald-700/60 border' },
                          { id: 'pine-planks', label: 'Pine Planks', desc: 'Survival wood blocks', bg: 'bg-[#451a03]' },
                          { id: 'path', label: 'Clay Path', desc: 'Marked pathways', bg: 'bg-[#7c2d12]' },
                          { id: 'deep-water', label: 'Deep Water', desc: 'Bottomless abyss', bg: 'bg-[#172554]' },
                          { id: 'water', label: 'Water', desc: 'Surface pools', bg: 'bg-[#1e3a8a]' },
                          { id: 'void', label: 'Void / Air', desc: 'Clear to grid sky', bg: 'bg-[#020617] border border-dashed border-slate-800' }
                        ] as const).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => selectTerrainHandler(item.id)}
                            className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${
                              selectedTerrain === item.id && selectedTool === 'terrain'
                                ? 'border-emerald-500 bg-slate-900/60 ring-1 ring-emerald-500/50'
                                : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-sm shrink-0 ${item.bg}`} />
                              <div>
                                <div className="text-[11px] font-semibold text-slate-200">{item.label}</div>
                                <div className="text-[9px] text-slate-500 leading-none">{item.desc}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brush Size */}
                    <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800/40 space-y-2">
                      <h4 className="text-[11px] font-mono text-slate-400 uppercase">Brush Width</h4>
                      <div className="flex gap-2">
                        {([1, 2, 3] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => { playSound.click(); onSetBrushSize(sz); }}
                            className={`flex-1 py-1.5 px-3 rounded text-xs font-mono transition-all border ${
                              brushSize === sz
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                                : 'bg-slate-950 hover:bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {sz}x{sz} Tile{sz > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Explore parameters */}
                {selectedTool === 'explore' && (
                  <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800/50 space-y-3">
                    <h3 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                      Explore Settings
                    </h3>
                    <div className="space-y-3 text-xs">
                      {/* Collision Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Block Collisions</span>
                        <button
                          onClick={() => { playSound.click(); onToggleCollision(); }}
                          className={`px-3 py-1.5 rounded font-mono text-[10px] transition-colors border ${
                            collisionEnabled 
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {collisionEnabled ? '✔️ COLLIDE' : '❌ CLIP MODE'}
                        </button>
                      </div>

                      {/* Lantern Fog Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Lantern Darkness</span>
                        <button
                          onClick={() => { playSound.click(); onToggleLantern(); }}
                          className={`px-3 py-1.5 rounded font-mono text-[10px] transition-colors border ${
                            lanternEnabled 
                              ? 'bg-amber-950/80 text-amber-400 border-amber-500/40' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {lanternEnabled ? '💡 LANTERN ON' : '🌑 DAYLIGHT'}
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800 pt-2.5">
                        💡 **Lantern effect**: Limits vision radius on the map, highlighting your layout in deep atmospheric shadow to simulate a dark forest. Use it to check lighting aesthetics!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. PRESETS TAB (30 presets) */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/20 p-3 rounded-lg border border-slate-800/30">
                  Select and place any of our **30 preset assets** on the grid. Multi-block items have visual highlights during placement.
                </div>

                {/* Categories */}
                {(['tree', 'water', 'building', 'farm'] as const).map((cat) => {
                  const filtered = PRESETS.filter(p => p.category === cat);
                  const catEmoji = cat === 'tree' ? '🌲' : cat === 'water' ? '💧' : cat === 'building' ? '⛩️' : '🌾';
                  
                  return (
                    <div key={cat} className="space-y-2">
                      <h3 className="text-xs font-mono font-semibold text-slate-300 capitalize flex items-center gap-1.5">
                        <span>{catEmoji}</span>
                        <span>{cat} Assets</span>
                        <span className="text-[9px] font-mono text-slate-500">({filtered.length})</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-1.5">
                        {filtered.map((preset) => {
                          const isSelected = selectedPreset?.id === preset.id && selectedTool === 'asset';
                          return (
                            <button
                              key={preset.id}
                              onClick={() => selectPresetHandler(preset)}
                              className={`p-2.5 rounded-lg border text-left transition-all text-xs flex items-center justify-between ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50'
                                  : 'border-slate-800/70 bg-slate-950/40 hover:bg-slate-900/30'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg w-6 h-6 flex items-center justify-center rounded bg-slate-900/60 border border-slate-800">
                                  {preset.symbol}
                                </span>
                                <div>
                                  <div className="font-semibold text-slate-200">{preset.name}</div>
                                  <div className="text-[9px] text-slate-400 truncate w-48">{preset.description}</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono py-0.5 px-1.5 rounded bg-slate-900/80 text-emerald-400 border border-emerald-500/10 shrink-0">
                                {preset.squaresCount} tile{preset.squaresCount > 1 ? 's' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. CUSTOM ASSET TAB */}
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800/30 text-xs text-slate-400 leading-relaxed">
                  Design a completely **custom block asset** by altering all parameters below. Choose exact size dimensions, categories, symbols, and grid footprint shapes!
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Asset Name</label>
                    <input
                      type="text"
                      value={customSettings.name}
                      onChange={(e) => setCustomSettings(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Symbol / Emoji Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Emoji Icon</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={customSettings.symbol}
                        onChange={(e) => setCustomSettings(p => ({ ...p, symbol: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-center text-slate-100 outline-none focus:border-emerald-500/50 font-serif"
                      />
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Base Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={customSettings.color}
                          onChange={(e) => setCustomSettings(p => ({ ...p, color: e.target.value }))}
                          className="w-10 h-8 bg-slate-950 border border-slate-800 rounded cursor-pointer outline-none shrink-0"
                        />
                        <input
                          type="text"
                          value={customSettings.color}
                          onChange={(e) => setCustomSettings(p => ({ ...p, color: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-slate-200 uppercase outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Class Category</label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {(['tree', 'water', 'building', 'farm'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCustomSettings(p => ({ ...p, category: cat }))}
                          className={`py-1.5 px-1 rounded font-mono text-[9px] uppercase tracking-wider border capitalize ${
                            customSettings.category === cat
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Footprint */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Width ({customSettings.width} cells)</label>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={customSettings.width}
                        onChange={(e) => setCustomSettings(p => ({ ...p, width: parseInt(e.target.value) }))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Height ({customSettings.height} cells)</label>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={customSettings.height}
                        onChange={(e) => setCustomSettings(p => ({ ...p, height: parseInt(e.target.value) }))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Footprint Pattern Shapes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Footprint Shape Layout</label>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      {(['solid', 'cross', 'corners'] as const).map((shape) => (
                        <button
                          key={shape}
                          onClick={() => setCustomSettings(p => ({ ...p, footprintType: shape }))}
                          className={`py-1 rounded border capitalize ${
                            customSettings.footprintType === shape
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {shape === 'solid' ? '⬛ Solid' : shape === 'cross' ? '➕ Cross' : '📐 Corners'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active footprint squares watermark */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                    <span>Generated Area:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {computeCustomOffsets(customSettings).length} occupied squares
                    </span>
                  </div>

                  {/* Build Action */}
                  <button
                    onClick={handleCreateCustomPreset}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg font-bold shadow-lg transition-all"
                  >
                    🛠️ Select Custom Asset
                  </button>
                </div>
              </div>
            )}

            {/* 4. PROCEDURAL GENERATOR */}
            {activeTab === 'procedural' && (
              <div className="space-y-4">
                <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800/30 text-xs text-slate-400 leading-relaxed">
                  Generate procedural dark-forest terrain on the grid automatically. Your layout and assets will be wiped and replaced based on these parameters.
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-4 text-xs">
                  
                  {/* Grid Size selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Map Resolution Grid</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                      {([30, 45, 60] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => {
                            playSound.click();
                            onUpdateProceduralSettings({ ...proceduralSettings, gridSize: sz });
                          }}
                          className={`py-1.5 rounded border ${
                            proceduralSettings.gridSize === sz
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sz}x{sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Land Platform shape */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Platform Land Shape</label>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      {([
                        { id: 'square', label: 'Square Plate' },
                        { id: 'circle', label: 'Ancient Circle' },
                        { id: 'islands', label: 'Archipelago' },
                        { id: 'donut', label: 'Spooky Ring' }
                      ] as const).map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => {
                            playSound.click();
                            onUpdateProceduralSettings({ ...proceduralSettings, shape: sh.id });
                          }}
                          className={`py-1.5 rounded border capitalize ${
                            proceduralSettings.shape === sh.id
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Land platform slider size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>Base Land size</span>
                      <span className="text-emerald-400">{proceduralSettings.basePlatformPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={proceduralSettings.basePlatformPercentage}
                      onChange={(e) => onUpdateProceduralSettings({ ...proceduralSettings, basePlatformPercentage: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Tree Density */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>Tree Coverage</span>
                      <span className="text-emerald-400">{proceduralSettings.treeDensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={proceduralSettings.treeDensity}
                      onChange={(e) => onUpdateProceduralSettings({ ...proceduralSettings, treeDensity: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Water size bodies */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>Pond / Water Likelihood</span>
                      <span className="text-emerald-400">{proceduralSettings.waterSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={proceduralSettings.waterSize}
                      onChange={(e) => onUpdateProceduralSettings({ ...proceduralSettings, waterSize: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Tree cluster likelihood */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>Tree Cluster Spawn</span>
                      <span className="text-emerald-400">{proceduralSettings.treeClusterLikelihood}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={proceduralSettings.treeClusterLikelihood}
                      onChange={(e) => onUpdateProceduralSettings({ ...proceduralSettings, treeClusterLikelihood: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Ruins/structures likelihood */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>Ancient Ruins Spawns</span>
                      <span className="text-emerald-400">{proceduralSettings.structureLikelihood}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={proceduralSettings.structureLikelihood}
                      onChange={(e) => onUpdateProceduralSettings({ ...proceduralSettings, structureLikelihood: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Terrain styling blend */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Moss & Foliage Blend Style</label>
                    <select
                      value={proceduralSettings.terrainBlend}
                      onChange={(e) => onUpdateProceduralSettings({ ...proceduralSettings, terrainBlend: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500/50 font-mono"
                    >
                      <option value="default">🌲 Dark Wood (Mossy Stone & Pine Planks)</option>
                      <option value="mossy">🧟 Necromancer Moss (Heavy Mossy Stone)</option>
                      <option value="swampy">🦎 swampy bog (Mud Path & green Slime)</option>
                    </select>
                  </div>

                  {/* Trigger procedurally */}
                  <button
                    onClick={onGenerateProcedural}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all animate-pulse"
                  >
                    🌀 Generate Procedural Terrain
                  </button>
                </div>
              </div>
            )}

            {/* 5. STORAGE & SAVING TAB */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800/30 text-xs text-slate-400 leading-relaxed">
                  Manage persistent browser local storage. You can save **one active custom map** and load it instantly. Use the Import/Export field below to share map layout text strings!
                </div>

                {/* Save Map Form */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Save World Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={() => { playSound.place(); onSaveMap(saveName); }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-wider rounded font-bold shadow"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Load Map Slot Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                    <h4 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wide">
                      Local Storage Save Slot
                    </h4>
                    {saveSlotInfo ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-100">{saveSlotInfo.name}</div>
                        <div className="text-[9px] font-mono text-slate-500 flex flex-col space-y-0.5">
                          <span>SAVED: {saveSlotInfo.savedAt}</span>
                          <span>PLACED ASSETS: {saveSlotInfo.assetCount} items</span>
                          <span>PAINTED TILES: {saveSlotInfo.tileCount} squares</span>
                        </div>
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={() => { playSound.generate(); onLoadMap(); }}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-semibold"
                          >
                            ✔️ Load Slot Map
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-sans italic py-1.5">
                        No saved maps found in this browser. Press the Save button above to persist your current planner design.
                      </div>
                    )}
                  </div>

                  {/* Reset Map Button */}
                  <button
                    onClick={() => { if (confirm("Clear current map and reset to starting default platform?")) { onResetMap(); } }}
                    className="w-full py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/20 text-xs font-mono uppercase rounded-lg"
                  >
                    🗑️ Reset Current Map
                  </button>
                </div>

                {/* Import/Export Backup Codes */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Map Share / Text Code Import
                  </h4>
                  <div className="text-[10px] text-slate-500">
                    You can copy the code string to backup or share your design, or paste one here to load a friend's world!
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExportText}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono"
                    >
                      📤 Export Code
                    </button>
                    {exportString && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(exportString);
                          alert("Export code copied to clipboard!");
                        }}
                        className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-white rounded text-xs"
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>

                  {exportString && (
                    <div className="relative">
                      <textarea
                        readOnly
                        value={exportString}
                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2 text-[9px] font-mono text-slate-400 focus:outline-none select-all"
                        onClick={(e) => (e.target as any).select()}
                      />
                    </div>
                  )}

                  <div className="border-t border-slate-800/50 pt-3 space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Paste Code to Import</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste base64 code..."
                        id="import-text-field"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-300 outline-none"
                      />
                      <button
                        onClick={() => {
                          const val = (document.getElementById('import-text-field') as HTMLInputElement)?.value;
                          handleImportText(val);
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs uppercase rounded font-bold"
                      >
                        Import
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FOOTER METRICS AND CREDIT FOOTNOTE */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-[9px] font-mono text-slate-500">
        <span>GRID: {gridSize} x {gridSize}</span>
        <span>BLOXD.IO MAP EDITOR</span>
        <span>v2.1.0</span>
      </div>
    </div>
  );
};
