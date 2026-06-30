import { PresetDefinition } from './types';

export const PRESETS: PresetDefinition[] = [
  // === TREES (10 presets) ===
  {
    id: 't1',
    name: 'Tall Pine',
    category: 'tree',
    symbol: '🌲',
    color: '#14532d',
    textColor: '#86efac',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'A dark, resilient pine tree typical of the deep forest.'
  },
  {
    id: 't2',
    name: 'Dead Oak',
    category: 'tree',
    symbol: '🪵',
    color: '#451a03',
    textColor: '#fca5a5',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'A dried, twisted husk of a once-mighty forest giant.'
  },
  {
    id: 't3',
    name: 'Mossy Birch',
    category: 'tree',
    symbol: '🌴',
    color: '#064e3b',
    textColor: '#6ee7b7',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'Birch covered in bioluminescent green moss.'
  },
  {
    id: 't4',
    name: 'Shadow Willow',
    category: 'tree',
    symbol: '🌿',
    color: '#1e293b',
    textColor: '#94a3b8',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'Its dark violet branches sweep down to touch the ground.'
  },
  {
    id: 't5',
    name: 'Autumn Maple',
    category: 'tree',
    symbol: '🍁',
    color: '#7c2d12',
    textColor: '#fdba74',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'Deep crimson leaves that glow faintly in the dark.'
  },
  {
    id: 't6',
    name: 'Spooky Thorn Tree',
    category: 'tree',
    symbol: '🌵',
    color: '#3b0764',
    textColor: '#d8b4fe',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'Gnarled thorn branches capable of catching unweary travelers.'
  },
  {
    id: 't7',
    name: 'Giant Sequoia',
    category: 'tree',
    symbol: '🌳',
    color: '#0f172a',
    textColor: '#38bdf8',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'An ancient redwood, taking up a 2x2 grid area.'
  },
  {
    id: 't8',
    name: 'Elderwood Sapling',
    category: 'tree',
    symbol: '🌱',
    color: '#166534',
    textColor: '#bbf7d0',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'A young elderwood tree sprouting from dark fertile clay.'
  },
  {
    id: 't9',
    name: 'Shimmering Bramble',
    category: 'tree',
    symbol: '🍂',
    color: '#500724',
    textColor: '#fbcfe8',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'A glowing thicket of purple-hued thorns.'
  },
  {
    id: 't10',
    name: 'Tree Cluster (4)',
    category: 'tree',
    symbol: '🎄',
    color: '#164e63',
    textColor: '#99f6e4',
    offsets: [[0, 0], [0, 1], [1, 0]], // L-shape footprint (3 squares) for a visual cluster of 4 close-knit crowns
    squaresCount: 3,
    description: 'A tight cluster of 4 dark forest trees taking up 3 grid squares.'
  },

  // === WATER (6 presets) ===
  {
    id: 'w1',
    name: 'Small Pond',
    category: 'water',
    symbol: '💧',
    color: '#1e3a8a',
    textColor: '#93c5fd',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'A peaceful, deep pool reflecting the starlit sky.'
  },
  {
    id: 'w2',
    name: 'Narrow Canal',
    category: 'water',
    symbol: '🌊',
    color: '#172554',
    textColor: '#60a5fa',
    offsets: [[0, 0], [0, 1], [0, 2]],
    squaresCount: 3,
    description: 'A 3-block-long stream of dark forest water.'
  },
  {
    id: 'w3',
    name: 'Sacred Spring',
    category: 'water',
    symbol: '🌀',
    color: '#0891b2',
    textColor: '#cffafe',
    offsets: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    squaresCount: 9,
    description: 'A large, bubbling spring believed to ward off evil forest spirits.'
  },
  {
    id: 'w4',
    name: 'Swamp Pit',
    category: 'water',
    symbol: '🧼',
    color: '#14532d',
    textColor: '#a3e635',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'Murky green marshland, perfect for growing glowing mushrooms.'
  },
  {
    id: 'w5',
    name: 'Geyser Pool',
    category: 'water',
    symbol: '♨️',
    color: '#701a75',
    textColor: '#f472b6',
    offsets: [[0, 0], [0, 1]],
    squaresCount: 2,
    description: 'A steaming geyser vent surrounded by purple crystalline minerals.'
  },
  {
    id: 'w6',
    name: 'Healing Well',
    category: 'water',
    symbol: '⛲',
    color: '#1e1b4b',
    textColor: '#818cf8',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'A single stone-rimmed well brimming with fresh pure groundwater.'
  },

  // === BUILDINGS & STRUCTURES (10 presets) ===
  {
    id: 'b1',
    name: 'Survival Shack',
    category: 'building',
    symbol: '🏚️',
    color: '#451a03',
    textColor: '#fcd34d',
    offsets: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
    squaresCount: 6,
    description: 'A rustic, wooden survival cabin with a warm lantern glow.'
  },
  {
    id: 'b2',
    name: 'Lookout Tower',
    category: 'building',
    symbol: '🗼',
    color: '#1e293b',
    textColor: '#f8fafc',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'A 2x2 watchtower structure built to spot approaching phantoms.'
  },
  {
    id: 'b3',
    name: 'Entry Portal',
    category: 'building',
    symbol: '🔮',
    color: '#4a044e',
    textColor: '#f472b6',
    offsets: [[0, 0], [0, 1], [0, 2]], // Horizontal 3-block-wide portal
    squaresCount: 3,
    description: 'A glowing obsidian portal taking up 3 grid squares. Your starting spawn point!'
  },
  {
    id: 'b4',
    name: 'Witch Hut',
    category: 'building',
    symbol: '🛖',
    color: '#2d064e',
    textColor: '#c084fc',
    offsets: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    squaresCount: 9,
    description: 'An eerie cauldron hut standing on wooden stilts.'
  },
  {
    id: 'b5',
    name: 'Altar of Shadows',
    category: 'building',
    symbol: '🕋',
    color: '#111827',
    textColor: '#ec4899',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'An ancient dark obsidian pedestal pulsing with eldritch energies.'
  },
  {
    id: 'b6',
    name: 'Stone Obelisk',
    category: 'building',
    symbol: '🗿',
    color: '#334155',
    textColor: '#cbd5e1',
    offsets: [[0, 0]],
    squaresCount: 1,
    description: 'A single carved stone pillar recording ancient Bloxd lore.'
  },
  {
    id: 'b7',
    name: 'Storage Vault',
    category: 'building',
    symbol: '📦',
    color: '#292524',
    textColor: '#e7e5e4',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'Secure stone cellar for storing wood, blocks, and ores.'
  },
  {
    id: 'b8',
    name: 'Blacksmith Forge',
    category: 'building',
    symbol: '🔥',
    color: '#7f1d1d',
    textColor: '#f97316',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
    squaresCount: 6,
    description: 'A stone forge heated with dark forest coal, sized 3x2.'
  },
  {
    id: 'b9',
    name: 'Graveyard Crypt',
    category: 'building',
    symbol: '🪦',
    color: '#0f172a',
    textColor: '#e2e8f0',
    offsets: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
    squaresCount: 6,
    description: 'A gothic vault surrounded by dark iron fences and ancient gravestones.'
  },
  {
    id: 'b10',
    name: 'Ancient Gate',
    category: 'building',
    symbol: '⛩️',
    color: '#5b21b6',
    textColor: '#a78bfa',
    offsets: [[0, 0], [0, 1], [0, 2]],
    squaresCount: 3,
    description: 'A giant dark-wood archway to demarcate boundaries.'
  },

  // === FARM PLOTS (4 presets) ===
  {
    id: 'f1',
    name: 'Wheat Patch',
    category: 'farm',
    symbol: '🌾',
    color: '#78350f',
    textColor: '#fbbf24',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'A 2x2 tilled field growing dark golden wheat.'
  },
  {
    id: 'f2',
    name: 'Pumpkin Patch',
    category: 'farm',
    symbol: '🎃',
    color: '#4c1d95',
    textColor: '#f97316',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'A 2x2 farming plot of slightly glowing jack-o-lanterns.'
  },
  {
    id: 'f3',
    name: 'Herb Garden',
    category: 'farm',
    symbol: '🌱',
    color: '#14532d',
    textColor: '#a3e635',
    offsets: [[0, 0], [0, 1], [0, 2]],
    squaresCount: 3,
    description: 'A long garden bed cultivating glowing mushrooms, moss, and nightshade.'
  },
  {
    id: 'f4',
    name: 'Dark Shroom Grow',
    category: 'farm',
    symbol: '🍄',
    color: '#4c0519',
    textColor: '#fda4af',
    offsets: [[0, 0], [0, 1], [1, 0], [1, 1]],
    squaresCount: 4,
    description: 'A damp wood box nursery ideal for propagating giant glowing fungi.'
  }
];
