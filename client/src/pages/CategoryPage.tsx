import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadState';
import { ProductGrid } from '../components/ProductGrid';
import { catalogueApi } from '../services/catalogueApi';
import type { CategoryProductsResponse } from '../types/catalogue';

const titleCase = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export function CategoryPage() {
  const { category = '' } = useParams();
  const [data, setData] = useState<CategoryProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await catalogueApi.getCategoryProducts(category)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this category.'); }
    finally { setLoading(false); }
  }, [category]);
  useEffect(() => { void load(); }, [load]);

  return <main className="page-shell page-content">
    <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>{titleCase(category)}</span></div>
    <div className="page-title"><p className="eyebrow">SHOP BY CATEGORY</p><h1>{titleCase(category)}</h1><p>A thoughtful selection, gathered in one place.</p></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : <>
      <section className="listing-section"><div className="section-heading section-heading--compact"><div><p className="eyebrow">THE HIGHLIGHTS</p><h2>Featured in {titleCase(category)}</h2></div></div><ProductGrid products={data?.featured ?? []} emptyMessage="No featured finds in this category just yet." /></section>
      <section className="listing-section"><div className="section-heading section-heading--compact"><div><p className="eyebrow">MORE TO DISCOVER</p><h2>Additional finds</h2></div></div><ProductGrid products={data?.additional ?? []} emptyMessage="There are no additional products in this category." /></section>
    </>}
  </main>;
}
