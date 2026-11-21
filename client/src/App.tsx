import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductPage } from './pages/ProductPage';
import { SearchPage } from './pages/SearchPage';
import { ThankYouPage } from './pages/ThankYouPage';

function Footer() {
  return <footer className="site-footer"><div className="page-shell site-footer__inner"><span className="brand brand--footer"><span className="brand-mark">m</span><span>MORROW<span className="brand-dot">.</span></span></span><span>Objects for a life well lived.</span><span>© {new Date().getFullYear()} Morrow Catalogue</span></div></footer>;
}

export function AppRoutes() {
  return <div className="app-shell"><Header /><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/categories/:category" element={<CategoryPage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/products/:id" element={<ProductPage />} />
    <Route path="/thank-you" element={<ThankYouPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes><Footer /></div>;
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
