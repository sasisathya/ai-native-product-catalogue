import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/ProductGrid';
import { ErrorState, LoadingState } from '../components/LoadState';
import { catalogueApi } from '../services/catalogueApi';
import type { Product } from '../types/catalogue';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProducts((await catalogueApi.getFeatured()).products); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load featured products.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <>
    <section className="hero page-shell">
      <div className="hero__copy"><p className="eyebrow">THOUGHTFULLY CHOSEN, MADE TO LAST</p><h1>Find the things<br /><em>you’ll keep.</em></h1><p className="hero__text">A considered collection of everyday essentials and singular finds, selected for a life well lived.</p><Link className="button button--dark" to="#featured">Explore the collection <span aria-hidden="true">↓</span></Link></div>
      <div className="hero__visual" aria-hidden="true"><div className="hero__arch"><div className="hero__sun" /><div className="hero__shape hero__shape--one" /><div className="hero__shape hero__shape--two" /><div className="hero__caption">OBJECTS FOR<br />SLOWER DAYS</div></div><span className="hero__spark">✳</span></div>
      <div className="hero__side-note">A SMALL EDITION OF EVERYDAY BEAUTY</div>
    </section>
    <section className="featured-section page-shell" id="featured">
      <div className="section-heading"><div><p className="eyebrow">THE MORROW EDIT</p><h2>Featured finds</h2></div><span className="section-count">01 — 05</span></div>
      {loading ? <LoadingState label="Finding your next favourite…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : <ProductGrid products={products} emptyMessage="Our featured collection is being refreshed. Check back soon." />}
    </section>
    <section className="closing-banner"><p>Good things find their way home.</p><span>Curated with care · Updated regularly</span></section>
  </>;
}
