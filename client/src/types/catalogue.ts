export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating?: { rate: number; count: number };
}

export interface FeaturedProductsResponse {
  products: Product[];
}

export interface CategoriesResponse {
  categories: string[];
}

export interface CategoryProductsResponse {
  category: string;
  featured: Product[];
  additional: Product[];
}

export interface SearchProductsResponse {
  query: string;
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

export interface CreateEnquiryRequest {
  productId: number;
  name: string;
  email: string;
  message: string;
}

export interface CreateEnquiryResponse {
  message: string;
}

export interface ApiErrorResponse {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}
