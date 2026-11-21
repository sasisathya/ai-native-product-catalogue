import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="page-shell not-found"><p className="eyebrow">404 · NOT FOUND</p><h1>This page wandered off.</h1><p>Let’s get you back to the good finds.</p><Link className="button button--dark" to="/">Return home <span aria-hidden="true">→</span></Link></main>;
}
