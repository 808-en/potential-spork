export type TerrainType = 'void' | 'grass' | 'dark-grass' | 'mossy-stone' | 'pine-planks' | 'path' | 'water' | 'deep-water';

export interface Tile {
  r: number;
  c: number;
  terrain: TerrainType;
}

export interface AssetInstance {
  id: string;
  presetId: string;
  name: string;
  r: number; // Row coordinate of pivot
  c: number; // Column coordinate of pivot
  offsets: [number, number][]; // Relative grid offsets occupied
  color: string;
  symbol: string;
  category: 'tree' | 'water' | 'building' | 'farm' | 'custom';
}

export interface PresetDefinition {
  id: string;
  name: string;
  category: 'tree' | 'water' | 'building' | 'farm';
  symbol: string;
  color: string;
  textColor: string;
  offsets: [number, number][];
  squaresCount: number;
  description: string;
}

export interface CustomAssetSettings {
  name: string;
  symbol: string;
  color: string;
  category: 'tree' | 'water' | 'building' | 'farm';
  width: number;
  height: number;
  footprintType: 'solid' | 'cross' | 'corners' | 'custom-offsets';
  customOffsets: [number, number][];
}

export interface ProceduralSettings {
  gridSize: number;
  shape: 'square' | 'circle' | 'islands' | 'donut';
  treeDensity: number; // 0 to 100
  waterSize: number; // 0 to 100
  treeClusterLikelihood: number; // 0 to 100
  structureLikelihood: number; // 0 to 100
  terrainBlend: 'mossy' | 'wooded' | 'swampy' | 'default';
  basePlatformPercentage: number; // 0 to 100
}

export interface PlayerState {
  r: number;
  c: number;
  facing: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  lanternIntensity: number; // range 0 - 100
}

export interface MapDataSave {
  gridSize: number;
  tiles: { [key: string]: TerrainType }; // Compact mapping of "r,c" -> TerrainType
  assets: Omit<AssetInstance, 'offsets'>[]; // Offsets can be reconstructed or stored compactly
  savedAt: string;
  name: string;
}
