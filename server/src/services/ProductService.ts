import type { Product } from '../models/product.js';
import type { ProductProvider } from '../providers/product/ProductProvider.js';
import { AppError, ProviderError } from '../errors/AppError.js';

export class ProductService {
  constructor(private readonly provider: ProductProvider, private readonly featuredIds: number[]) {
    if (featuredIds.length !== 5 || new Set(featuredIds).size !== 5 || featuredIds.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error('Exactly five distinct positive featured product IDs are required');
    }
  }

  async getFeatured(): Promise<Product[]> {
    const all = await this.withProvider(() => this.provider.listProducts());
    const products = new Map(all.map((product) => [product.id, product]));
    const featured = this.featuredIds.flatMap((id) => products.has(id) ? [products.get(id)!] : []);
    if (featured.length !== 5) {
      throw new AppError(502, 'FEATURED_PRODUCTS_UNAVAILABLE', 'Configured featured products are temporarily unavailable');
    }
    return featured;
  }

  async getCategories(): Promise<string[]> {
    return this.withProvider(() => this.provider.listCategories());
  }

  async getCategoryProducts(category: string): Promise<{ category: string; featured: Product[]; additional: Product[] }> {
    const categories = await this.getCategories();
    if (!categories.includes(category)) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    const products = await this.withProvider(() => this.provider.listByCategory(category));
    const featuredIds = new Set(this.featuredIds);
    return {
      category,
      featured: products.filter((product) => featuredIds.has(product.id)),
      additional: products.filter((product) => !featuredIds.has(product.id)),
    };
  }

  async getProduct(id: number): Promise<Product> {
    const product = await this.withProvider(() => this.provider.getById(id));
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    return product;
  }

  async search(query: string): Promise<Product[]> {
    const normalized = query.trim().toLocaleLowerCase();
    const products = await this.withProvider(() => this.provider.listProducts());
    return products.filter((product) => `${product.title} ${product.description} ${product.category}`.toLocaleLowerCase().includes(normalized));
  }

  private async withProvider<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof ProviderError) throw new AppError(502, 'PRODUCT_SOURCE_UNAVAILABLE', 'Product catalogue is temporarily unavailable');
      throw new AppError(502, 'PRODUCT_SOURCE_UNAVAILABLE', 'Product catalogue is temporarily unavailable');
    }
  }
}
