import type {
  CategoriesResponse,
  CategoryProductsResponse,
  CreateEnquiryRequest,
  CreateEnquiryResponse,
  FeaturedProductsResponse,
  ProductResponse,
  SearchProductsResponse,
} from '../types/catalogue';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class CatalogueApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'CatalogueApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...options?.headers },
    });
  } catch {
    throw new CatalogueApiError('We could not reach the catalogue. Please check your connection and try again.');
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'error' in payload
      ? (payload as { error?: { message?: string } }).error?.message
      : undefined;
    throw new CatalogueApiError(message ?? 'Something went wrong. Please try again.', response.status);
  }
  return payload as T;
}

export const catalogueApi = {
  getFeatured: () => request<FeaturedProductsResponse>('/products/featured'),
  getCategories: () => request<CategoriesResponse>('/categories'),
  getCategoryProducts: (category: string) => request<CategoryProductsResponse>(`/categories/${encodeURIComponent(category)}/products`),
  searchProducts: (query: string) => request<SearchProductsResponse>(`/products/search?q=${encodeURIComponent(query)}`),
  getProduct: (id: number) => request<ProductResponse>(`/products/${id}`),
  createEnquiry: (enquiry: CreateEnquiryRequest) => request<CreateEnquiryResponse>('/enquiries', {
    method: 'POST',
    body: JSON.stringify(enquiry),
  }),
};
