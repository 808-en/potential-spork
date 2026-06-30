import React, { useEffect, useRef, useState } from 'react';
import { TerrainType, AssetInstance, PresetDefinition, PlayerState } from '../types';
import { playSound } from '../utils/audio';

interface MapGridProps {
  gridSize: number;
  tiles: Record<string, TerrainType>;
  assets: AssetInstance[];
  selectedTool: 'select' | 'terrain' | 'asset' | 'erase-asset' | 'explore';
  selectedTerrain: TerrainType;
  selectedPreset: PresetDefinition | null;
  customPreset: AssetInstance | null;
  player: PlayerState;
  onTileDraw: (r: number, c: number, terrain: TerrainType) => void;
  onAssetPlace: (r: number, c: number) => void;
  onAssetRemove: (id: string) => void;
  onPlayerMove: (r: number, c: number) => void;
  collisionEnabled: boolean;
  lanternEnabled: boolean;
  brushSize: number; // 1, 2, or 3
}

export const MapGrid: React.FC<MapGridProps> = ({
  gridSize,
  tiles,
  assets,
  selectedTool,
  selectedTerrain,
  selectedPreset,
  customPreset,
  player,
  onTileDraw,
  onAssetPlace,
  onAssetRemove,
  onPlayerMove,
  collisionEnabled,
  lanternEnabled,
  brushSize
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom camera states
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const cellSize = 32; // base size of a grid cell in pixels

  // Helper to convert screen coordinates to Grid cell (row, col)
  const getCellFromScreen = (clientX: number, clientY: number): { r: number; c: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Position relative to canvas origin
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Scale according to CSS stretching vs drawing resolution
    const drawX = (canvasX / rect.width) * canvasRef.current.width;
    const drawY = (canvasY / rect.height) * canvasRef.current.height;
    
    // Convert drawing coordinates back to rows and cols
    const col = Math.floor(drawX / cellSize);
    const row = Math.floor(drawY / cellSize);
    
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { r: row, c: col };
    }
    return null;
  };

  // Center view on player
  const centerOnPlayer = () => {
    if (!canvasRef.current || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    const playerX = player.c * cellSize + cellSize / 2;
    const playerY = player.r * cellSize + cellSize / 2;
    
    // Target position center of viewport
    const newX = containerWidth / 2 - playerX * zoom;
    const newY = containerHeight / 2 - playerY * zoom;
    
    setPan({ x: newX, y: newY });
  };

  // Listen to canvas resize and scale resolution
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = gridSize * cellSize;
      canvasRef.current.height = gridSize * cellSize;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridSize]);

  // Center on player initially or when exploring toggles
  useEffect(() => {
    if (selectedTool === 'explore') {
      centerOnPlayer();
    }
  }, [selectedTool]);

  // Handle zooming with scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.005 * zoomIntensity, 0.4), 3.0);
    
    // Zoom toward mouse pointer
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const gridX = (mouseX - pan.x) / zoom;
      const gridY = (mouseY - pan.y) / zoom;
      
      setZoom(newZoom);
      setPan({
        x: mouseX - gridX * newZoom,
        y: mouseY - gridY * newZoom
      });
    }
  };

  // Drag start (Pan or Draw)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey || selectedTool === 'select') {
      // Pan mode
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else {
      // Draw/Action mode
      const cell = getCellFromScreen(e.clientX, e.clientY);
      if (cell) {
        setIsDrawing(true);
        handleCellAction(cell.r, cell.c, e.ctrlKey);
      }
    }
  };

  // Drag moving
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Handle Panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // 2. Track Hover Cell
    const cell = getCellFromScreen(e.clientX, e.clientY);
    setHoveredCell(cell);

    // 3. Handle Drag Drawing
    if (isDrawing && cell) {
      handleCellAction(cell.r, cell.c, e.ctrlKey);
    }
  };

  // Drag release
  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setIsDrawing(false);
    setHoveredCell(null);
  };

  // Perform brush / placement logic
  const handleCellAction = (row: number, col: number, isAlternative: boolean) => {
    if (selectedTool === 'terrain') {
      // Draw terrain with brush size support
      const rRange = Math.floor(brushSize / 2);
      for (let dr = -rRange; dr <= rRange; dr++) {
        for (let dc = -rRange; dc <= rRange; dc++) {
          const targetR = row + dr;
          const targetC = col + dc;
          if (targetR >= 0 && targetR < gridSize && targetC >= 0 && targetC < gridSize) {
            onTileDraw(targetR, targetC, selectedTerrain);
          }
        }
      }
    } else if (selectedTool === 'asset') {
      onAssetPlace(row, col);
      setIsDrawing(false); // Only place once per click
    } else if (selectedTool === 'erase-asset') {
      // Check if an asset is placed under this cell
      const assetAtCell = assets.find(a => 
        a.r === row && a.c === col || 
        a.offsets.some(([dr, dc]) => a.r + dr === row && a.c + dc === col)
      );
      if (assetAtCell) {
        onAssetRemove(assetAtCell.id);
        playSound.erase();
      }
    } else if (selectedTool === 'explore') {
      // Teleport player here if valid path or shift-clicked
      onPlayerMove(row, col);
      setIsDrawing(false);
    }
  };

  // Helper to determine active placing offsets and validity
  const getActivePlacementOffsets = (): [number, number][] => {
    if (selectedPreset) return selectedPreset.offsets;
    if (customPreset) return customPreset.offsets;
    return [[0, 0]];
  };

  const isPlacementValid = (pivotR: number, pivotC: number, offsets: [number, number][]): boolean => {
    for (const [dr, dc] of offsets) {
      const r = pivotR + dr;
      const c = pivotC + dc;
      
      // 1. Boundary Check
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
      
      // 2. Void Check (structures can't float in void!)
      const terrain = tiles[`${r},${c}`] || 'void';
      if (terrain === 'void') return false;

      // 3. For Buildings/Trees: Water Check
      const activeCategory = selectedPreset ? selectedPreset.category : (customPreset ? customPreset.category : 'custom');
      if (activeCategory !== 'water' && (terrain === 'water' || terrain === 'deep-water')) {
        return false;
      }

      // 4. Overlap Check
      const isOccupied = assets.some(a => 
        a.r === r && a.c === c || 
        a.offsets.some(([adr, adc]) => a.r + adr === r && a.c + adc === c)
      );
      if (isOccupied) return false;
    }
    return true;
  };

  // Render loop using Canvas Context 2D
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#020617'; // Deep space dark blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. DRAW BASE TERRAIN TILES
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const tileType = tiles[`${r},${c}`] || 'void';
        const x = c * cellSize;
        const y = r * cellSize;

        switch (tileType) {
          case 'void':
            // Draw a sparse dark tile
            ctx.fillStyle = '#020617';
            ctx.fillRect(x, y, cellSize, cellSize);
            // Draw starry retro speckles occasionally
            if ((r * 17 + c * 23) % 29 === 0) {
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(x + 14, y + 10, 2, 2);
            }
            break;

          case 'grass':
            ctx.fillStyle = '#065f46'; // Forest Green
            ctx.fillRect(x, y, cellSize, cellSize);
            // Micro-texture
            ctx.fillStyle = '#047857';
            ctx.fillRect(x + 4, y + 4, 4, 4);
            ctx.fillRect(x + 20, y + 18, 4, 4);
            break;

          case 'dark-grass':
            ctx.fillStyle = '#14532d'; // Dark Forest Moss Green
            ctx.fillRect(x, y, cellSize, cellSize);
            // Micro-texture shadow spots
            ctx.fillStyle = '#0f3e23';
            ctx.fillRect(x + 8, y + 12, 6, 4);
            ctx.fillRect(x + 22, y + 6, 4, 6);
            break;

          case 'mossy-stone':
            ctx.fillStyle = '#475569'; // Slate Stone
            ctx.fillRect(x, y, cellSize, cellSize);
            // Moss spots
            ctx.fillStyle = '#15803d';
            ctx.fillRect(x + 2, y + 2, 10, 4);
            ctx.fillRect(x + 18, y + 16, 6, 8);
            // Stone joints
            ctx.fillStyle = '#334155';
            ctx.fillRect(x, y + cellSize - 2, cellSize, 2);
            ctx.fillRect(x + cellSize - 2, y, 2, cellSize);
            break;

          case 'pine-planks':
            ctx.fillStyle = '#451a03'; // Redwood Plank
            ctx.fillRect(x, y, cellSize, cellSize);
            // Plank seams
            ctx.fillStyle = '#270e01';
            ctx.fillRect(x, y, cellSize, 2);
            ctx.fillRect(x, y + 10, cellSize, 2);
            ctx.fillRect(x, y + 21, cellSize, 2);
            ctx.fillRect(x + 12, y, 2, 10);
            ctx.fillRect(x + 24, y + 10, 2, 11);
            break;

          case 'path':
            ctx.fillStyle = '#7c2d12'; // Clay Path / Gravel
            ctx.fillRect(x, y, cellSize, cellSize);
            // Speckles
            ctx.fillStyle = '#9a3412';
            ctx.fillRect(x + 6, y + 8, 4, 4);
            ctx.fillRect(x + 18, y + 22, 2, 2);
            break;

          case 'water':
            ctx.fillStyle = '#1e3a8a'; // Blue water
            ctx.fillRect(x, y, cellSize, cellSize);
            // Ripples
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(x + 4, y + 14, 12, 2);
            ctx.fillRect(x + 16, y + 6, 8, 2);
            break;

          case 'deep-water':
            ctx.fillStyle = '#172554'; // Deep abyss blue
            ctx.fillRect(x, y, cellSize, cellSize);
            // Abyss shadow
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x + 8, y + 8, 16, 16);
            break;
        }
      }
    }

    // 2. DRAW GRID LINES (Semi-transparent)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)'; // Light emerald grid
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 0; r <= gridSize; r++) {
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(gridSize * cellSize, r * cellSize);
    }
    for (let c = 0; c <= gridSize; c++) {
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, gridSize * cellSize);
    }
    ctx.stroke();

    // 3. DRAW PLACED ASSETS
    assets.forEach((asset) => {
      const ax = asset.c * cellSize;
      const ay = asset.r * cellSize;

      // Draw bounding footprint overlay for multi-tile assets
      if (asset.offsets.length > 1) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        asset.offsets.forEach(([dr, dc]) => {
          ctx.fillRect((asset.c + dc) * cellSize + 2, (asset.r + dr) * cellSize + 2, cellSize - 4, cellSize - 4);
        });
      }

      // Draw subtle shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ax + cellSize / 2, ay + cellSize / 2 + 6, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Asset Symbol / Icon
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Calculate visual center based on full offset bounding box
      let minRow = 0, maxRow = 0, minCol = 0, maxCol = 0;
      asset.offsets.forEach(([dr, dc]) => {
        minRow = Math.min(minRow, dr);
        maxRow = Math.max(maxRow, dr);
        minCol = Math.min(minCol, dc);
        maxCol = Math.max(maxCol, dc);
      });
      
      const widthCells = maxCol - minCol + 1;
      const heightCells = maxRow - minRow + 1;
      const visualX = ax + (widthCells * cellSize) / 2;
      const visualY = ay + (heightCells * cellSize) / 2 - 4; // lift slightly for 3D look

      ctx.fillText(asset.symbol, visualX, visualY);
    });

    // 4. DRAW EXPLORER PLAYER
    const px = player.c * cellSize + cellSize / 2;
    const py = player.r * cellSize + cellSize / 2;

    // Draw Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 10, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Player body (Stylized lantern traveler)
    ctx.fillStyle = '#f59e0b'; // Amber core (lantern lantern glow)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    
    // Outer robe
    ctx.fillStyle = '#065f46'; // Deep emerald cloak
    ctx.beginPath();
    ctx.arc(px, py - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lantern Glow head
    ctx.fillStyle = '#fef08a'; // Bright yellow face glow
    ctx.beginPath();
    ctx.arc(px, py - 7, 4, 0, Math.PI * 2);
    ctx.fill();

    // Face hood shadow / Eye dots
    ctx.fillStyle = '#022c22';
    ctx.fillRect(px - 3, py - 8, 2, 2);
    ctx.fillRect(px + 1, py - 8, 2, 2);

    // Draw direction indicator
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    const indSize = 4;
    switch (player.facing) {
      case 'up':
        ctx.moveTo(px, py - 18);
        ctx.lineTo(px - indSize, py - 14);
        ctx.lineTo(px + indSize, py - 14);
        break;
      case 'down':
        ctx.moveTo(px, py + 14);
        ctx.lineTo(px - indSize, py + 10);
        ctx.lineTo(px + indSize, py + 10);
        break;
      case 'left':
        ctx.moveTo(px - 14, py);
        ctx.lineTo(px - 10, py - indSize);
        ctx.lineTo(px - 10, py + indSize);
        break;
      case 'right':
        ctx.moveTo(px + 14, py);
        ctx.lineTo(px + 10, py - indSize);
        ctx.lineTo(px + 10, py + indSize);
        break;
    }
    ctx.fill();

    // 5. DRAW DYNAMIC LANTERN LIGHTING (Fog of war)
    if (lanternEnabled) {
      // Create a full-canvas mask
      const lightingCanvas = document.createElement('canvas');
      lightingCanvas.width = canvas.width;
      lightingCanvas.height = canvas.height;
      const lCtx = lightingCanvas.getContext('2d');
      if (lCtx) {
        // Fill canvas with deep forest night mask (opaque dark indigo)
        lCtx.fillStyle = 'rgba(8, 10, 24, 0.94)';
        lCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate dynamic radius based on intensity
        const radius = 100 + (player.lanternIntensity / 100) * 120;

        // Draw radial light beam
        const radGrad = lCtx.createRadialGradient(px, py, 10, px, py, radius);
        radGrad.addColorStop(0, 'rgba(253, 224, 71, 1)'); // Intense golden center
        radGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.65)'); // Soft warm surrounding
        radGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)'); // Emerald transition glow
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fades to pitch dark
        
        lCtx.globalCompositeOperation = 'destination-out';
        lCtx.fillStyle = radGrad;
        lCtx.beginPath();
        lCtx.arc(px, py, radius, 0, Math.PI * 2);
        lCtx.fill();

        // Overlay light blend onto main canvas
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(lightingCanvas, 0, 0);
        ctx.restore();
      }
    }

    // 6. DRAW HOVER & BRUSH PREVIEWS
    if (hoveredCell) {
      const hx = hoveredCell.c * cellSize;
      const hy = hoveredCell.r * cellSize;

      if (selectedTool === 'terrain') {
        // Drawing Terrain Brush preview
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        const rRange = Math.floor(brushSize / 2);
        const brushPx = brushSize * cellSize;
        ctx.strokeRect(hx - rRange * cellSize, hy - rRange * cellSize, brushPx, brushPx);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(hx - rRange * cellSize, hy - rRange * cellSize, brushPx, brushPx);
      } else if (selectedTool === 'asset') {
        // Placing Asset footprint preview
        const offsets = getActivePlacementOffsets();
        const valid = isPlacementValid(hoveredCell.r, hoveredCell.c, offsets);
        
        ctx.fillStyle = valid ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.strokeStyle = valid ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;

        offsets.forEach(([dr, dc]) => {
          const rx = (hoveredCell.c + dc) * cellSize;
          const ry = (hoveredCell.r + dr) * cellSize;
          ctx.fillRect(rx + 1, ry + 1, cellSize - 2, cellSize - 2);
          ctx.strokeRect(rx + 1, ry + 1, cellSize - 2, cellSize - 2);
        });

        // Draw preview of symbol itself
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          selectedPreset ? selectedPreset.symbol : (customPreset ? customPreset.symbol : '❓'),
          hx + cellSize / 2,
          hy + cellSize / 2
        );
      } else if (selectedTool === 'erase-asset') {
        // Red eraser indicator
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
      } else if (selectedTool === 'explore') {
        // Draw explorer ghost
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        ctx.fillRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
      }
    }
  }, [gridSize, tiles, assets, hoveredCell, selectedTool, selectedTerrain, selectedPreset, customPreset, player, lanternEnabled, brushSize]);

  // Handle right clicks context menu prevention inside canvas
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#030712] overflow-hidden rounded-2xl border border-slate-800/80 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)] select-none"
      onWheel={handleWheel}
    >
      {/* Zoom / Pan Action HUD (top right absolute) */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 3.0))}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/50 flex items-center justify-center shadow-lg transition-all text-xs font-mono"
          title="Zoom In"
        >
          ➕
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/50 flex items-center justify-center shadow-lg transition-all text-xs font-mono"
          title="Zoom Out"
        >
          ➖
        </button>
        <button
          onClick={() => { setZoom(1.2); setPan({ x: 50, y: 50 }); }}
          className="px-2.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 rounded-lg border border-emerald-500/20 text-xs font-mono shadow-lg transition-all uppercase tracking-wider"
          title="Reset Camera View"
        >
          Reset View
        </button>
        <button
          onClick={centerOnPlayer}
          className="px-2.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-amber-400 rounded-lg border border-amber-500/20 text-xs font-mono shadow-lg transition-all uppercase tracking-wider"
          title="Snap to player location"
        >
          🎯 Explorer
        </button>
      </div>

      {/* Explorer Mode Status Display */}
      {selectedTool === 'explore' && (
        <div className="absolute top-4 left-4 z-10 bg-slate-950/90 border border-amber-500/30 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-xs font-mono font-medium text-amber-300 uppercase tracking-wide">
            Explore Mode Active
          </span>
          <span className="text-[10px] text-slate-400 font-sans border-l border-slate-800 pl-2">
            Use WASD/Arrows or Joystick to walk!
          </span>
        </div>
      )}

      {/* Map Interactive Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0px 0px',
          width: `${gridSize * cellSize}px`,
          height: `${gridSize * cellSize}px`,
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
      >
        <canvas 
          id="map-canvas"
          ref={canvasRef} 
          className="block select-none pointer-events-auto"
        />
      </div>

      {/* Grid Coordinates status watermark */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/80 rounded px-2 py-1 text-[10px] font-mono text-slate-500 pointer-events-none">
        GRID: {gridSize}x{gridSize} | {hoveredCell ? `CELL: [R: ${hoveredCell.r}, C: ${hoveredCell.c}]` : 'SELECT CELL'} | ZOOM: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
