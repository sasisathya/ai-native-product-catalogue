import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EnquiryForm } from '../components/EnquiryForm';
import { ErrorState, LoadingState } from '../components/LoadState';
import { catalogueApi } from '../services/catalogueApi';
import type { Product } from '../types/catalogue';

export function ProductPage() {
  const { id = '' } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProduct((await catalogueApi.getProduct(Number(id))).product); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this product.'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  return <main className="page-shell page-content">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>{product?.title ?? 'Product details'}</span></div>
    {loading ? <LoadingState label="Opening product details…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : product && <>
      <section className="product-detail">
        <div className="product-detail__image-wrap"><img className="product-detail__image" src={product.imageUrl} alt={product.title} /></div>
        <div className="product-detail__info"><p className="eyebrow">{product.category.replaceAll('-', ' ')}</p><h1>{product.title}</h1><div className="product-detail__price">${product.price.toFixed(2)}</div>{product.rating && <p className="detail-rating"><span className="rating">★ {product.rating.rate.toFixed(1)}</span> <span>({product.rating.count} reviews)</span></p>}<div className="detail-rule" /><h2>About this find</h2><p className="product-description">{product.description}</p><a className="text-link" href="#enquiry">Enquire about this item <span aria-hidden="true">↓</span></a></div>
      </section>
      <section className="enquiry-section" id="enquiry"><div className="enquiry-aside"><p className="eyebrow">PERSONAL SERVICE</p><h2>A question, a detail, or just curious?</h2><p>Tell us what’s on your mind. We’d love to help you find the right piece.</p></div><EnquiryForm product={product} /></section>
    </>}
  </main>;
}
