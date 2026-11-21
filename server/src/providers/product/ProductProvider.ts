import type { Product } from '../../models/product.js';

export interface ProductProvider {
  listProducts(): Promise<Product[]>;
  listCategories(): Promise<string[]>;
  listByCategory(category: string): Promise<Product[]>;
  getById(id: number): Promise<Product | null>;
}
