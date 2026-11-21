import { Link } from 'react-router-dom';
import type { Product } from '../types/catalogue';

function formatCategory(category: string): string {
  return category.replaceAll('-', ' ');
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link className="product-card__image-link" to={`/products/${product.id}`} aria-label={`View ${product.title}`}>
        <img className="product-card__image" src={product.imageUrl} alt={product.title} loading="lazy" />
      </Link>
      <div className="product-card__body">
        <p className="eyebrow">{formatCategory(product.category)}</p>
        <h3><Link to={`/products/${product.id}`}>{product.title}</Link></h3>
        <div className="product-card__meta">
          {product.rating && <span className="rating" aria-label={`Rated ${product.rating.rate} out of 5`}>★ {product.rating.rate.toFixed(1)}</span>}
          <strong>${product.price.toFixed(2)}</strong>
        </div>
      </div>
    </article>
  );
}
