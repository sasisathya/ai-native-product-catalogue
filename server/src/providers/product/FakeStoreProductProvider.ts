import type { Product } from '../../models/product.js';
import { ProviderError } from '../../errors/AppError.js';
import type { ProductProvider } from './ProductProvider.js';

export class FakeStoreProductProvider implements ProductProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl = 'https://fakestoreapi.com', timeoutMs = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async listProducts(): Promise<Product[]> {
    const data = await this.request<unknown>('/products');
    if (!Array.isArray(data)) throw new ProviderError();
    return data.map(mapProduct);
  }

  async listCategories(): Promise<string[]> {
    const data = await this.request<unknown>('/products/categories');
    if (!Array.isArray(data) || !data.every((category) => typeof category === 'string' && category.trim().length > 0)) {
      throw new ProviderError();
    }
    return data;
  }

  async listByCategory(category: string): Promise<Product[]> {
    const data = await this.request<unknown>(`/products/category/${encodeURIComponent(category)}`);
    if (!Array.isArray(data)) throw new ProviderError();
    return data.map(mapProduct);
  }

  async getById(id: number): Promise<Product | null> {
    const product = await this.request<unknown>(`/products/${id}`);
    return product === null ? null : mapProduct(product);
  }

  private async request<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { signal: controller.signal });
      if (!response.ok) throw new ProviderError();
      return (await response.json()) as T;
    } catch {
      // Keep provider URL, response body, and transport errors inside the adapter.
      throw new ProviderError();
    } finally {
      clearTimeout(timeout);
    }
  }
}

function mapProduct(value: unknown): Product {
  if (typeof value !== 'object' || value === null) throw new ProviderError();
  const product = value as Record<string, unknown>;
  const rating = product.rating;
  if (
    !Number.isSafeInteger(product.id) || Number(product.id) < 1 ||
    typeof product.title !== 'string' || !product.title.trim() ||
    typeof product.description !== 'string' ||
    typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0 ||
    typeof product.category !== 'string' || !product.category.trim() ||
    typeof product.image !== 'string' || !/^https?:\/\//i.test(product.image) ||
    (rating !== undefined && (typeof rating !== 'object' || rating === null ||
      typeof (rating as Record<string, unknown>).rate !== 'number' ||
      !Number.isFinite((rating as Record<string, number>).rate) ||
      (rating as Record<string, number>).rate < 0 || (rating as Record<string, number>).rate > 5 ||
      typeof (rating as Record<string, unknown>).count !== 'number' ||
      !Number.isSafeInteger((rating as Record<string, number>).count) || (rating as Record<string, number>).count < 0))
  ) throw new ProviderError();

  return {
    id: product.id as number,
    title: product.title as string,
    description: product.description as string,
    price: product.price as number,
    category: product.category as string,
    imageUrl: product.image as string,
    ...(rating ? { rating: { rate: (rating as { rate: number }).rate, count: (rating as { count: number }).count } } : {}),
  };
}
