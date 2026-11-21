import type { Product } from '../types/catalogue';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, emptyMessage = 'No products found.' }: { products: Product[]; emptyMessage?: string }) {
  if (!products.length) return <div className="empty-state">{emptyMessage}</div>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
