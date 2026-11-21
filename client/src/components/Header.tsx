import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { catalogueApi } from '../services/catalogueApi';
import { SearchBar } from './SearchBar';

export function Header() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  useEffect(() => {
    let active = true;
    catalogueApi.getCategories()
      .then((response) => { if (active) setCategories(response.categories); })
      .catch(() => { if (active) setCategoryError(true); });
    return () => { active = false; };
  }, []);

  return (
    <header className="site-header">
      <div className="header-main page-shell">
        <Link className="brand" to="/" aria-label="Morrow home"><span className="brand-mark">m</span><span>MORROW<span className="brand-dot">.</span></span></Link>
        <div className="header-search"><SearchBar /></div>
        <Link className="header-link" to="/">Discover <span aria-hidden="true">↗</span></Link>
      </div>
      {(categories.length > 0 || categoryError) && <nav className="category-nav" aria-label="Product categories"><div className="page-shell category-nav__inner">
        {categoryError ? <span className="category-nav__error" role="status">Categories are temporarily unavailable.</span> : categories.map((category) => <NavLink key={category} to={`/categories/${encodeURIComponent(category)}`} className={({ isActive }) => isActive ? 'category-nav__link is-active' : 'category-nav__link'}>{category}</NavLink>)}
      </div></nav>}
    </header>
  );
}
