export enum PartType {
  CPU = 'CPU',
  MOTHERBOARD = 'Motherboard',
  RAM = 'RAM',
  GPU = 'GPU',
  STORAGE = 'Storage',
  PSU = 'Power Supply',
  CASE = 'Cabinet',
  COOLER = 'Cooler'
}

export interface ComponentData {
  id: string;
  name: string;
  price: number;
  image: string;
  type: PartType;
  specs: Record<string, string>;
  rating: number;
  retailer: 'Amazon.in' | 'MDComputers' | 'Vedant' | 'PrimeABGB';
  url: string;
}

export interface BuildState {
  [PartType.CPU]?: ComponentData;
  [PartType.MOTHERBOARD]?: ComponentData;
  [PartType.RAM]?: ComponentData;
  [PartType.GPU]?: ComponentData;
  [PartType.STORAGE]?: ComponentData;
  [PartType.PSU]?: ComponentData;
  [PartType.CASE]?: ComponentData;
  [PartType.COOLER]?: ComponentData;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  issues: string[];
  notes: string[];
  estimatedWattage: number;
  bottleneck: string;
  aiScore: number;
}
