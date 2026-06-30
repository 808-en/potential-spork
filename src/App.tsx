import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TerrainType, AssetInstance, PresetDefinition, ProceduralSettings, PlayerState } from './types';
import { PRESETS } from './presets';
import { playSound } from './utils/audio';
import { MapGrid } from './components/MapGrid';
import { Sidebar } from './components/Sidebar';
import { Joystick } from './components/Joystick';

export default function App() {
  const [gridSize, setGridSize] = useState<number>(60);
  const [tiles, setTiles] = useState<Record<string, TerrainType>>({});
  const [assets, setAssets] = useState<AssetInstance[]>([]);
  
  // Selection tools
  const [selectedTool, setSelectedTool] = useState<'select' | 'terrain' | 'asset' | 'erase-asset' | 'explore'>('terrain');
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('dark-grass');
  const [selectedPreset, setSelectedPreset] = useState<PresetDefinition | null>(PRESETS[0]); // Default Tall Pine
  const [customPreset, setCustomPreset] = useState<AssetInstance | null>(null);
  const [brushSize, setBrushSize] = useState<number>(1);
  
  // Player state
  const [player, setPlayer] = useState<PlayerState>({
    r: 30,
    c: 30,
    facing: 'down',
    isMoving: false,
    lanternIntensity: 80
  });
  
  // Custom states
  const [collisionEnabled, setCollisionEnabled] = useState<boolean>(true);
  const [lanternEnabled, setLanternEnabled] = useState<boolean>(true);
  const [ambienceEnabled, setAmbienceEnabled] = useState<boolean>(false);
  const [ambienceNodes, setAmbienceNodes] = useState<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  
  // Procedural default settings
  const [proceduralSettings, setProceduralSettings] = useState<ProceduralSettings>({
    gridSize: 60,
    shape: 'circle',
    treeDensity: 20,
    waterSize: 15,
    treeClusterLikelihood: 40,
    structureLikelihood: 30,
    terrainBlend: 'default',
    basePlatformPercentage: 60
  });

  const [saveSlotInfo, setSaveSlotInfo] = useState<{ savedAt: string; name: string; assetCount: number; tileCount: number } | null>(null);

  // Helper to load default starter project
  const loadDefaultStarterMap = (sz: number) => {
    const initialTiles: Record<string, TerrainType> = {};
    const cx = Math.floor(sz / 2);
    const cy = Math.floor(sz / 2);
    const platformHalf = 10; // 20x20 platform size

    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        if (Math.abs(r - cx) <= platformHalf && Math.abs(c - cy) <= platformHalf) {
          initialTiles[`${r},${c}`] = 'dark-grass';
        } else {
          initialTiles[`${r},${c}`] = 'void';
        }
      }
    }

    const initialAssets: AssetInstance[] = [
      // Entry Portal preset
      {
        id: 'init-portal',
        presetId: 'b3',
        name: 'Entry Portal',
        r: cx - 2,
        c: cy - 2,
        offsets: [[0, 0], [0, 1], [0, 2]],
        color: '#4a044e',
        symbol: '🔮',
        category: 'building'
      },
      // Tall pine trees
      {
        id: 'init-pine-1',
        presetId: 't1',
        name: 'Tall Pine',
        r: cx + 3,
        c: cy - 4,
        offsets: [[0, 0]],
        color: '#14532d',
        symbol: '🌲',
        category: 'tree'
      },
      {
        id: 'init-pine-2',
        presetId: 't1',
        name: 'Tall Pine',
        r: cx + 4,
        c: cy - 3,
        offsets: [[0, 0]],
        color: '#14532d',
        symbol: '🌲',
        category: 'tree'
      },
      // Shimmery bush
      {
        id: 'init-bramble-1',
        presetId: 't9',
        name: 'Shimmering Bramble',
        r: cx - 4,
        c: cy + 4,
        offsets: [[0, 0]],
        color: '#500724',
        symbol: '🍂',
        category: 'tree'
      },
      // Watchtower
      {
        id: 'init-tower',
        presetId: 'b2',
        name: 'Lookout Tower',
        r: cx + 4,
        c: cy + 3,
        offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
        color: '#1e293b',
        symbol: '🗼',
        category: 'building'
      },
      // Small Water pond
      {
        id: 'init-pond',
        presetId: 'w1',
        name: 'Small Pond',
        r: cx - 6,
        c: cy - 6,
        offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
        color: '#1e3a8a',
        symbol: '💧',
        category: 'water'
      }
    ];

    setGridSize(sz);
    setTiles(initialTiles);
    setAssets(initialAssets);
    
    // Position player right near the portal
    setPlayer({
      r: cx,
      c: cy + 1,
      facing: 'down',
      isMoving: false,
      lanternIntensity: 80
    });
  };

  // Sync state on app mount
  useEffect(() => {
    // 1. Try to load from Local Storage slot
    const raw = localStorage.getItem(`bloxd_map_one_block_save`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setGridSize(parsed.gridSize || 60);
        setTiles(parsed.tiles || {});
        
        const loadedAssets: AssetInstance[] = (parsed.assets || []).map((a: any) => {
          let offsets = a.offsets;
          if (!offsets) {
            if (a.presetId === 'custom') {
              offsets = [[0, 0]];
            } else {
              const pr = PRESETS.find(p => p.id === a.presetId);
              offsets = pr ? pr.offsets : [[0, 0]];
            }
          }
          return {
            ...a,
            offsets
          };
        });
        setAssets(loadedAssets);

        // Find initial portal to spawn player, or fallback center
        const portal = loadedAssets.find(a => a.presetId === 'b3');
        setPlayer({
          r: portal ? portal.r : Math.floor((parsed.gridSize || 60) / 2),
          c: portal ? portal.c + 1 : Math.floor((parsed.gridSize || 60) / 2),
          facing: 'down',
          isMoving: false,
          lanternIntensity: 80
        });
      } catch (e) {
        loadDefaultStarterMap(60);
      }
    } else {
      loadDefaultStarterMap(60);
    }
    
    // Refresh slot save metadata
    updateSaveSlotMetadata();
  }, []);

  const updateSaveSlotMetadata = () => {
    try {
      const raw = localStorage.getItem(`bloxd_map_one_block_save`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSaveSlotInfo({
          savedAt: parsed.savedAt,
          name: parsed.name,
          assetCount: parsed.assets?.length || 0,
          tileCount: Object.keys(parsed.tiles || {}).filter(k => parsed.tiles[k] !== 'void').length
        });
      } else {
        setSaveSlotInfo(null);
      }
    } catch (e) {
      setSaveSlotInfo(null);
    }
  };

  // PERSIST TO SLOT
  const handleSaveMap = (name: string) => {
    const saveObj = {
      gridSize,
      tiles,
      assets: assets.map(({ id, presetId, name, r, c, color, symbol, category, offsets }) => ({
        id,
        presetId,
        name,
        r,
        c,
        color,
        symbol,
        category,
        offsets
      })),
      savedAt: new Date().toLocaleString(),
      name: name || 'Bloxd Dark Forest Map'
    };

    localStorage.setItem(`bloxd_map_one_block_save`, JSON.stringify(saveObj));
    updateSaveSlotMetadata();
    playSound.place();
  };

  // LOAD FROM SLOT
  const handleLoadMap = () => {
    const raw = localStorage.getItem(`bloxd_map_one_block_save`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setGridSize(parsed.gridSize || 60);
        setTiles(parsed.tiles || {});
        
        const loadedAssets: AssetInstance[] = (parsed.assets || []).map((a: any) => {
          let offsets = a.offsets;
          if (!offsets) {
            const pr = PRESETS.find(p => p.id === a.presetId);
            offsets = pr ? pr.offsets : [[0, 0]];
          }
          return {
            ...a,
            offsets
          };
        });
        setAssets(loadedAssets);

        const portal = loadedAssets.find(a => a.presetId === 'b3');
        setPlayer({
          r: portal ? portal.r : Math.floor((parsed.gridSize || 60) / 2),
          c: portal ? portal.c + 1 : Math.floor((parsed.gridSize || 60) / 2),
          facing: 'down',
          isMoving: false,
          lanternIntensity: 80
        });
        playSound.generate();
      } catch (e) {
        alert("Failed to read local storage save.");
      }
    }
  };

  const handleResetMap = () => {
    playSound.erase();
    loadDefaultStarterMap(gridSize);
  };

  // 2D BRUSH OR DRAWING UPDATES
  const handleTileDraw = (r: number, c: number, terrain: TerrainType) => {
    // Modify tile record
    setTiles(prev => ({
      ...prev,
      [`${r},${c}`]: terrain
    }));
  };

  // ASSET INSTANCE REMOVAL
  const handleAssetRemove = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // ASSET PLACEMENT HANDLER
  const handleAssetPlace = (r: number, c: number) => {
    let activePreset: Omit<AssetInstance, 'id' | 'r' | 'c'> | null = null;

    if (selectedPreset) {
      activePreset = {
        presetId: selectedPreset.id,
        name: selectedPreset.name,
        offsets: selectedPreset.offsets,
        color: selectedPreset.color,
        symbol: selectedPreset.symbol,
        category: selectedPreset.category as any
      };
    } else if (customPreset) {
      activePreset = {
        presetId: 'custom',
        name: customPreset.name,
        offsets: customPreset.offsets,
        color: customPreset.color,
        symbol: customPreset.symbol,
        category: customPreset.category
      };
    }

    if (!activePreset) {
      playSound.error();
      return;
    }

    // Validate placements on entire footprint offsets
    let isValid = true;
    for (const [dr, dc] of activePreset.offsets) {
      const targetR = r + dr;
      const targetC = c + dc;
      
      // Boundary
      if (targetR < 0 || targetR >= gridSize || targetC < 0 || targetC >= gridSize) {
        isValid = false;
        break;
      }
      
      // Terrain Void
      const terrain = tiles[`${targetR},${targetC}`] || 'void';
      if (terrain === 'void') {
        isValid = false;
        break;
      }

      // Water checking for non-water category assets
      if (activePreset.category !== 'water' && (terrain === 'water' || terrain === 'deep-water')) {
        isValid = false;
        break;
      }

      // Existing asset overlap check
      const occupied = assets.some(a => 
        (a.r === targetR && a.c === targetC) ||
        a.offsets.some(([adr, adc]) => a.r + adr === targetR && a.c + adc === targetC)
      );
      if (occupied) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      playSound.error();
      return;
    }

    const newAsset: AssetInstance = {
      id: `placed-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      presetId: activePreset.presetId,
      name: activePreset.name,
      r,
      c,
      offsets: activePreset.offsets,
      color: activePreset.color,
      symbol: activePreset.symbol,
      category: activePreset.category as any
    };

    setAssets(prev => [...prev, newAsset]);
    playSound.place();
  };

  // KEYBOARD AND JOYSTICK MOVEMENT MECHANICS
  const attemptPlayerStep = (dr: number, dc: number, facing: 'up' | 'down' | 'left' | 'right') => {
    const nextR = player.r + dr;
    const nextC = player.c + dc;

    setPlayer(prev => ({ ...prev, facing }));

    if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize) {
      playSound.error();
      return;
    }

    if (collisionEnabled) {
      const terrain = tiles[`${nextR},${nextC}`] || 'void';
      if (terrain === 'void') {
        playSound.error();
        return;
      }

      if (terrain === 'deep-water') {
        playSound.error();
        return;
      }

      // Asset collisions
      const occupied = assets.some(a => 
        (a.r === nextR && a.c === nextC) ||
        a.offsets.some(([adr, adc]) => a.r + adr === nextR && a.c + adc === nextC)
      );
      if (occupied) {
        playSound.error();
        return;
      }
    }

    setPlayer(prev => ({
      ...prev,
      r: nextR,
      c: nextC,
      isMoving: true
    }));
    playSound.step();
  };

  // Keyboard hooks for desktop keys
  useEffect(() => {
    if (selectedTool !== 'explore') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let dr = 0;
      let dc = 0;
      let facing = player.facing;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          dr = -1;
          facing = 'up';
          break;
        case 's':
        case 'arrowdown':
          dr = 1;
          facing = 'down';
          break;
        case 'a':
        case 'arrowleft':
          dc = -1;
          facing = 'left';
          break;
        case 'd':
        case 'arrowright':
          dc = 1;
          facing = 'right';
          break;
        default:
          return;
      }

      e.preventDefault();
      attemptPlayerStep(dr, dc, facing);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTool, player, tiles, assets, collisionEnabled, gridSize]);

  // Joystick state direction movement hook
  const [joystickDir, setJoystickDir] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!joystickDir || selectedTool !== 'explore') return;

    const interval = setInterval(() => {
      let dr = 0;
      let dc = 0;
      let facing = player.facing;

      if (Math.abs(joystickDir.x) > Math.abs(joystickDir.y)) {
        dc = joystickDir.x > 0 ? 1 : -1;
        facing = joystickDir.x > 0 ? 'right' : 'left';
      } else {
        dr = joystickDir.y > 0 ? 1 : -1;
        facing = joystickDir.y > 0 ? 'down' : 'up';
      }

      attemptPlayerStep(dr, dc, facing);
    }, 160);

    return () => clearInterval(interval);
  }, [joystickDir, selectedTool, player, tiles, assets, collisionEnabled, gridSize]);

  // DYNAMIC PROCEDURAL WORLD GENERATION
  const handleGenerateProcedural = () => {
    playSound.generate();
    const sz = proceduralSettings.gridSize;
    const newTiles: Record<string, TerrainType> = {};
    const newAssets: AssetInstance[] = [];
    const cx = Math.floor(sz / 2);
    const cy = Math.floor(sz / 2);

    // 1. Build Plate shapes
    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        const dist = Math.sqrt((r - cx) ** 2 + (c - cy) ** 2);
        const maxRadius = (sz / 2) * (proceduralSettings.basePlatformPercentage / 100);
        let isLand = false;

        if (proceduralSettings.shape === 'square') {
          isLand = Math.abs(r - cx) <= maxRadius && Math.abs(c - cy) <= maxRadius;
        } else if (proceduralSettings.shape === 'circle') {
          isLand = dist <= maxRadius;
        } else if (proceduralSettings.shape === 'donut') {
          isLand = dist <= maxRadius && dist >= maxRadius * 0.35;
        } else if (proceduralSettings.shape === 'islands') {
          // Multi-frequency noise layout
          const noise = Math.sin(r * 0.35) * Math.cos(c * 0.35) + Math.sin(r * 0.1) * Math.cos(c * 0.1);
          isLand = dist <= maxRadius * 1.15 && noise > -0.15;
        }

        if (isLand) {
          let terrain: TerrainType = 'dark-grass';
          if (proceduralSettings.terrainBlend === 'mossy') {
            terrain = Math.random() < 0.2 ? 'mossy-stone' : 'dark-grass';
          } else if (proceduralSettings.terrainBlend === 'swampy') {
            terrain = Math.random() < 0.2 ? 'path' : 'dark-grass';
          } else {
            terrain = Math.random() < 0.05 ? 'pine-planks' : 'dark-grass';
          }
          newTiles[`${r},${c}`] = terrain;
        } else {
          newTiles[`${r},${c}`] = 'void';
        }
      }
    }

    // 2. Add Water Ponds
    const waterSeeds = Math.floor((proceduralSettings.waterSize / 100) * 10);
    for (let seed = 0; seed < waterSeeds; seed++) {
      const landKeys = Object.keys(newTiles).filter(k => newTiles[k] !== 'void');
      if (landKeys.length === 0) break;
      const rKey = landKeys[Math.floor(Math.random() * landKeys.length)];
      const [sr, sc] = rKey.split(',').map(Number);
      
      const pondRadius = Math.floor(Math.random() * 2) + 1;
      for (let dr = -pondRadius; dr <= pondRadius; dr++) {
        for (let dc = -pondRadius; dc <= pondRadius; dc++) {
          const tr = sr + dr;
          const tc = sc + dc;
          if (newTiles[`${tr},${tc}`] && newTiles[`${tr},${tc}`] !== 'void') {
            newTiles[`${tr},${tc}`] = Math.random() < 0.35 ? 'deep-water' : 'water';
          }
        }
      }
    }

    // 3. Place spawning Entry Portal near center
    let portalPlaced = false;
    let pRow = cx;
    let pCol = cy;

    for (let radius = 0; radius < 15; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const tr = cx + dr;
          const tc = cy + dc;
          const offsets: [number, number][] = [[0, 0], [0, 1], [0, 2]];

          let valid = true;
          for (const [dor, doc] of offsets) {
            const terr = newTiles[`${tr + dor},${tc + doc}`] || 'void';
            if (terr === 'void' || terr === 'water' || terr === 'deep-water') {
              valid = false;
              break;
            }
          }

          if (valid) {
            pRow = tr;
            pCol = tc;
            newAssets.push({
              id: 'procedural-portal',
              presetId: 'b3',
              name: 'Entry Portal',
              r: pRow,
              c: pCol,
              offsets,
              color: '#4a044e',
              symbol: '🔮',
              category: 'building'
            });
            portalPlaced = true;
            break;
          }
        }
        if (portalPlaced) break;
      }
      if (portalPlaced) break;
    }

    // Portal Fallback guarantee
    if (!portalPlaced) {
      newTiles[`${cx},${cy}`] = 'dark-grass';
      newTiles[`${cx},${cy+1}`] = 'dark-grass';
      newTiles[`${cx},${cy+2}`] = 'dark-grass';
      newAssets.push({
        id: 'procedural-portal-fallback',
        presetId: 'b3',
        name: 'Entry Portal',
        r: cx,
        c: cy,
        offsets: [[0,0],[0,1],[0,2]],
        color: '#4a044e',
        symbol: '🔮',
        category: 'building'
      });
      pRow = cx;
      pCol = cy;
    }

    // Spawn Player right inside portal
    setPlayer({
      r: pRow,
      c: pCol + 1,
      facing: 'down',
      isMoving: false,
      lanternIntensity: 85
    });

    // 4. Place Tree Clusters
    const clusterCount = Math.floor((proceduralSettings.treeClusterLikelihood / 100) * (proceduralSettings.treeDensity / 100) * (sz * 1.5));
    let clusterPlaced = 0;
    let cAttempts = 0;
    while (clusterPlaced < clusterCount && cAttempts < 150) {
      cAttempts++;
      const tr = Math.floor(Math.random() * sz);
      const tc = Math.floor(Math.random() * sz);
      const cOffsets: [number, number][] = [[0, 0], [0, 1], [1, 0]];

      let valid = true;
      for (const [dr, dc] of cOffsets) {
        const terr = newTiles[`${tr+dr},${tc+dc}`] || 'void';
        if (terr === 'void' || terr === 'water' || terr === 'deep-water') {
          valid = false;
        }
        const occupied = newAssets.some(a => 
          (a.r === tr + dr && a.c === tc + dc) ||
          a.offsets.some(([adr, adc]) => a.r + adr === tr + dr && a.c + adc === tc + dc)
        );
        if (occupied) {
          valid = false;
        }
      }

      if (valid) {
        newAssets.push({
          id: `p-cluster-${clusterPlaced}`,
          presetId: 't10',
          name: 'Tree Cluster (4)',
          r: tr,
          c: tc,
          offsets: cOffsets,
          color: '#164e63',
          symbol: '🎄',
          category: 'tree'
        });
        clusterPlaced++;
      }
    }

    // 5. Place Individual Trees
    const treesCount = Math.floor((proceduralSettings.treeDensity / 100) * (sz * sz * 0.35));
    let treesPlaced = 0;
    let tAttempts = 0;
    while (treesPlaced < treesCount && tAttempts < 400) {
      tAttempts++;
      const tr = Math.floor(Math.random() * sz);
      const tc = Math.floor(Math.random() * sz);

      const terr = newTiles[`${tr},${tc}`] || 'void';
      if (terr !== 'void' && terr !== 'water' && terr !== 'deep-water') {
        const occupied = newAssets.some(a => 
          (a.r === tr && a.c === tc) ||
          a.offsets.some(([adr, adc]) => a.r + adr === tr && a.c + adc === tc)
        );
        if (!occupied) {
          const tIds = ['t1', 't2', 't3', 't4', 't5', 't6', 't8', 't9'];
          const pickedId = tIds[Math.floor(Math.random() * tIds.length)];
          const preset = PRESETS.find(p => p.id === pickedId)!;

          newAssets.push({
            id: `p-tree-${treesPlaced}`,
            presetId: preset.id,
            name: preset.name,
            r: tr,
            c: tc,
            offsets: [[0,0]],
            color: preset.color,
            symbol: preset.symbol,
            category: 'tree'
          });
          treesPlaced++;
        }
      }
    }

    // 6. Place structures / ruins
    const structuresCount = Math.floor((proceduralSettings.structureLikelihood / 100) * 4);
    let structsPlaced = 0;
    let sAttempts = 0;
    const sIds = ['b1', 'b2', 'b4', 'b5', 'b6', 'b8', 'b9'];
    while (structsPlaced < structuresCount && sAttempts < 100) {
      sAttempts++;
      const tr = Math.floor(Math.random() * sz);
      const tc = Math.floor(Math.random() * sz);
      const pickedId = sIds[Math.floor(Math.random() * sIds.length)];
      const preset = PRESETS.find(p => p.id === pickedId)!;

      let valid = true;
      for (const [dr, dc] of preset.offsets) {
        const terr = newTiles[`${tr+dr},${tc+dc}`] || 'void';
        if (terr === 'void' || terr === 'water' || terr === 'deep-water') {
          valid = false;
        }
        const occupied = newAssets.some(a => 
          (a.r === tr + dr && a.c === tc + dc) ||
          a.offsets.some(([adr, adc]) => a.r + adr === tr + dr && a.c + adc === tc + dc)
        );
        if (occupied) {
          valid = false;
        }
      }

      if (valid) {
        newAssets.push({
          id: `p-struct-${structsPlaced}`,
          presetId: preset.id,
          name: preset.name,
          r: tr,
          c: tc,
          offsets: preset.offsets,
          color: preset.color,
          symbol: preset.symbol,
          category: 'building'
        });
        structsPlaced++;
      }
    }

    setGridSize(sz);
    setTiles(newTiles);
    setAssets(newAssets);
  };

  // BIOLUMINESCENT AMBIENCE CRICKET SOUND SYNTHESIZER
  const toggleAmbienceSynth = () => {
    playSound.click();
    const isNowOn = !ambienceEnabled;
    setAmbienceEnabled(isNowOn);

    if (isNowOn) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        
        // Setup wind / white noise generator
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Lowpass filter for deep wind rumble
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;

        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.02, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(windGain);
        windGain.connect(ctx.destination);
        whiteNoise.start();

        // Setup crickets chirping pulse loop
        const cricketTimer = setInterval(() => {
          // Play a rhythmic cricket chirp burst (high frequency pulse)
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const pGain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(4500, now);
          
          // Chirp pulse modulate
          pGain.gain.setValueAtTime(0, now);
          pGain.gain.linearRampToValueAtTime(0.015, now + 0.02);
          pGain.gain.linearRampToValueAtTime(0.005, now + 0.05);
          pGain.gain.linearRampToValueAtTime(0.015, now + 0.08);
          pGain.gain.linearRampToValueAtTime(0, now + 0.12);

          osc.connect(pGain);
          pGain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.15);
        }, 1200);

        // Keep references to clean up
        (window as any)._ambientCtx = ctx;
        (window as any)._ambientCricketTimer = cricketTimer;
        (window as any)._ambientNoiseNode = whiteNoise;
      } catch (e) {
        console.error("Ambience block bypass");
      }
    } else {
      // Clean up sound loops
      try {
        const ctx = (window as any)._ambientCtx;
        const timer = (window as any)._ambientCricketTimer;
        const noise = (window as any)._ambientNoiseNode;
        if (timer) clearInterval(timer);
        if (noise) noise.stop();
        if (ctx) ctx.close();
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup sounds on unmount
      try {
        const ctx = (window as any)._ambientCtx;
        const timer = (window as any)._ambientCricketTimer;
        if (timer) clearInterval(timer);
        if (ctx) ctx.close();
      } catch (e) {}
    };
  }, []);

  // Compute stats indicators
  const totalTrees = assets.filter(a => a.category === 'tree').length;
  const totalWater = assets.filter(a => a.category === 'water').length;
  const totalStructures = assets.filter(a => a.category === 'building').length;
  const landTilesCount = Object.keys(tiles).filter(k => tiles[k] !== 'void').length;

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-[#050814] text-slate-100 overflow-hidden font-sans p-3 lg:p-4 gap-4">
      
      {/* 1. LEFT SIDE PANEL: MAIN 2D MAP EDITOR AREA */}
      <div className="flex-1 flex flex-col h-full relative min-h-[400px]">
        
        {/* TOP STATUS CONTROL HUD */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-950/85 border border-slate-800/80 rounded-2xl px-5 py-3.5 mb-3 gap-3 z-20 backdrop-blur-md shadow-lg">
          
          {/* Logo Title and Stats */}
          <div className="flex items-center gap-4">
            <span className="text-xl shrink-0">🔮</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                  Bloxd One-Block Planner
                </h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                  Active Area: {gridSize}x{gridSize}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>🟢 Grass Land: <b className="text-slate-200">{landTilesCount}</b></span>
                <span>🌲 Trees: <b className="text-slate-200">{totalTrees}</b></span>
                <span>⛩️ Build: <b className="text-slate-200">{totalStructures}</b></span>
                <span>💧 Ponds: <b className="text-slate-200">{totalWater}</b></span>
              </div>
            </div>
          </div>

          {/* Quick HUD Toolbar Actions */}
          <div className="flex items-center gap-2.5">
            {/* Ambient Synth Controller */}
            <button
              onClick={toggleAmbienceSynth}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ${
                ambienceEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
              title="Toggle retro forest cricket synthesizers"
            >
              <span>{ambienceEnabled ? '🔊 Ambient Crickets On' : '🔇 Mute Ambience'}</span>
            </button>

            {/* Quick Helper button */}
            <div className="text-[10px] text-slate-500 font-sans hidden md:block max-w-[200px] text-right">
              Middle-click/Shift-click and drag to scroll map. Zoom with mouse scroll wheel.
            </div>
          </div>
        </div>

        {/* INTERACTIVE GRID VIEW CANVAS */}
        <div className="flex-1 w-full h-full relative min-h-0">
          <MapGrid
            gridSize={gridSize}
            tiles={tiles}
            assets={assets}
            selectedTool={selectedTool}
            selectedTerrain={selectedTerrain}
            selectedPreset={selectedPreset}
            customPreset={customPreset}
            player={player}
            brushSize={brushSize}
            onTileDraw={handleTileDraw}
            onAssetPlace={handleAssetPlace}
            onAssetRemove={handleAssetRemove}
            onPlayerMove={attemptPlayerStep}
            collisionEnabled={collisionEnabled}
            lanternEnabled={lanternEnabled}
          />

          {/* ON-SCREEN VIRTUAL JOYSTICK (Bottom Left Floating) */}
          <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
            <Joystick onDirectionChange={setJoystickDir} />
          </div>
          
          {/* Legend indicator explaining active tool */}
          <div className="absolute bottom-6 right-6 z-10 bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 max-w-[240px] text-[10px] leading-relaxed shadow-lg backdrop-blur pointer-events-none">
            <div className="font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">Active Brush Tip</div>
            {selectedTool === 'terrain' && (
              <p className="text-slate-300">
                🖌️ Drawing terrain: <span className="text-slate-100 font-semibold uppercase">{selectedTerrain.replace('-', ' ')}</span>. Click & drag over grid cells to paint like a pixel pen.
              </p>
            )}
            {selectedTool === 'asset' && (
              <p className="text-slate-300">
                ✨ Placing Asset: <span className="text-slate-100 font-semibold">{selectedPreset ? selectedPreset.name : customPreset?.name}</span>. Click grid to place. Multi-tile footprints require free space.
              </p>
            )}
            {selectedTool === 'erase-asset' && (
              <p className="text-slate-300">
                🧽 Delete Asset: Click on any placed tree, house, or pond on the grid to clear its footprint.
              </p>
            )}
            {selectedTool === 'explore' && (
              <p className="text-slate-300">
                🚶 Explorer Active! Tap/click grid cell to teleport, or hold the on-screen joystick to walk around.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. RIGHT SIDE PANEL: ADMINISTRATIVE SIDEBAR DASHBOARD */}
      <div className="h-full shrink-0">
        <Sidebar
          gridSize={gridSize}
          selectedTool={selectedTool}
          selectedTerrain={selectedTerrain}
          selectedPreset={selectedPreset}
          customPreset={customPreset}
          brushSize={brushSize}
          collisionEnabled={collisionEnabled}
          lanternEnabled={lanternEnabled}
          proceduralSettings={proceduralSettings}
          
          onSelectTool={setSelectedTool}
          onSelectTerrain={setSelectedTerrain}
          onSelectPreset={setSelectedPreset}
          onSelectCustomPreset={setCustomPreset}
          onSetBrushSize={setBrushSize}
          onToggleCollision={() => setCollisionEnabled(!collisionEnabled)}
          onToggleLantern={() => setLanternEnabled(!lanternEnabled)}
          onUpdateProceduralSettings={setProceduralSettings}
          onGenerateProcedural={handleGenerateProcedural}
          onSaveMap={handleSaveMap}
          onLoadMap={handleLoadMap}
          onResetMap={handleResetMap}
          saveSlotInfo={saveSlotInfo}
        />
      </div>
      
    </div>
  );
}
