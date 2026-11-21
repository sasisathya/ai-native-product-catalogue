import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadState';
import { ProductGrid } from '../components/ProductGrid';
import { catalogueApi } from '../services/catalogueApi';
import type { Product } from '../types/catalogue';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!query) { setProducts([]); setLoading(false); setError(''); return; }
    setLoading(true); setError('');
    try { setProducts((await catalogueApi.searchProducts(query)).products); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not search products.'); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);

  return <main className="page-shell page-content">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Search</span></div>
    <div className="page-title"><p className="eyebrow">FIND YOUR NEXT FAVOURITE</p><h1>Search results</h1><p>{query ? <>Showing matches for <strong>“{query}”</strong></> : 'Enter a word or phrase in the search bar above.'}</p></div>
    {loading ? <LoadingState label="Searching the collection…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : query ? <ProductGrid products={products} emptyMessage={`No products matched “${query}”. Try another search.`} /> : <div className="empty-state">Start with a search above to explore the collection.</div>}
  </main>;
}
