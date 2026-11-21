import { Link, useLocation } from 'react-router-dom';

export function ThankYouPage() {
  const location = useLocation();
  const productTitle = (location.state as { productTitle?: string } | null)?.productTitle;
  return <main className="page-shell thank-you"><div className="thank-you__mark">✓</div><p className="eyebrow">MESSAGE RECEIVED</p><h1>Thank you<span className="brand-dot">.</span></h1><p>Your enquiry{productTitle ? <> about <strong>{productTitle}</strong></> : ''} is with our team. We’ll be in touch soon.</p><Link className="button button--dark" to="/">Back to the collection <span aria-hidden="true">→</span></Link></main>;
}
