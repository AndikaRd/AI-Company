export interface IEmbeddingProvider {
  name: string;
  generateEmbedding(text: string): Promise<number[] | null>;
  getDimension(): number;
  isAvailable(): Promise<boolean>;
}

