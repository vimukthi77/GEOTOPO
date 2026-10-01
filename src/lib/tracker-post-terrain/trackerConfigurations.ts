export interface TrackerTerrainConfig {
  id: string;
  name: string;
  stringCount: number;
  position: 'Corner' | 'Internal';
  pileCount: number;
  segmentCount: number;
  segmentLengths: number[]; // Segment lengths along inclined line in mm
  totalLengthMm: number;    // Sum of segmentLengths in mm
  totalLengthM: number;     // totalLengthMm / 1000
  description: string;
}

export const TRACKER_TERRAIN_CONFIGS: Record<string, TrackerTerrainConfig> = {
  '2S-CORNER': {
    id: '2S-CORNER',
    name: '2 String Corner',
    stringCount: 2,
    position: 'Corner',
    pileCount: 8,
    segmentCount: 7,
    segmentLengths: [8050, 9200, 9200, 9200, 8850, 8850, 7900],
    totalLengthMm: 61250,
    totalLengthM: 61.25,
    description: '2-String Corner array configuration with 8 pile points across 7 physical inclined segments.',
  },
  '2S-INTERNAL': {
    id: '2S-INTERNAL',
    name: '2 String Internal',
    stringCount: 2,
    position: 'Internal',
    pileCount: 9,
    segmentCount: 8,
    segmentLengths: [6800, 8050, 8050, 7700, 7700, 8050, 8050, 6800],
    totalLengthMm: 61200,
    totalLengthM: 61.2,
    description: '2-String Internal array configuration with 9 pile points across 8 physical inclined segments.',
  },
  '3S-CORNER': {
    id: '3S-CORNER',
    name: '3 String Corner',
    stringCount: 3,
    position: 'Corner',
    pileCount: 11,
    segmentCount: 10,
    segmentLengths: [9200, 9200, 9200, 9200, 8850, 8850, 9200, 9200, 9200, 9200],
    totalLengthMm: 91700,
    totalLengthM: 91.7,
    description: '3-String Corner array configuration with 11 pile points across 10 physical inclined segments.',
  },
  '3S-INTERNAL': {
    id: '3S-INTERNAL',
    name: '3 String Internal',
    stringCount: 3,
    position: 'Internal',
    pileCount: 12,
    segmentCount: 11,
    segmentLengths: [7850, 9200, 9200, 8050, 8050, 8050, 8050, 8850, 8850, 9200, 7850],
    totalLengthMm: 93200,
    totalLengthM: 93.2,
    description: '3-String Internal array configuration with 12 pile points across 11 physical inclined segments.',
  },
  '4S-CORNER': {
    id: '4S-CORNER',
    name: '4 String Corner',
    stringCount: 4,
    position: 'Corner',
    pileCount: 15,
    segmentCount: 14,
    segmentLengths: [8050, 9200, 8050, 8050, 9200, 9200, 9200, 9200, 8850, 8850, 9200, 9200, 9200, 8050],
    totalLengthMm: 122950,
    totalLengthM: 122.95,
    description: '4-String Corner array configuration with 15 pile points across 14 physical inclined segments.',
  },
  '4S-INTERNAL': {
    id: '4S-INTERNAL',
    name: '4 String Internal',
    stringCount: 4,
    position: 'Internal',
    pileCount: 16,
    segmentCount: 15,
    segmentLengths: [7800, 8050, 8050, 9200, 9200, 8050, 8050, 8050, 8050, 8850, 8850, 9200, 8050, 8050, 7800],
    totalLengthMm: 124100,
    totalLengthM: 124.1,
    description: '4-String Internal array configuration with 16 pile points across 15 physical inclined segments.',
  },
};

export const TRACKER_TERRAIN_CONFIG_LIST = Object.values(TRACKER_TERRAIN_CONFIGS);
