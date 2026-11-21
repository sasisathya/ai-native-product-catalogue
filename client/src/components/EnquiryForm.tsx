import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogueApi } from '../services/catalogueApi';
import type { Product } from '../types/catalogue';

interface FormValues { name: string; email: string; message: string }

export function EnquiryForm({ product }: { product: Product }) {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>({ name: '', email: '', message: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();
    if (!name || name.length > 100 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !message || message.length > 2000) {
      setError('Please check your name, email address, and message.');
      return;
    }
    setSubmitting(true);
    try {
      await catalogueApi.createEnquiry({ productId: product.id, name, email, message });
      navigate('/thank-you', { state: { productTitle: product.title } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not send your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="enquiry-form" onSubmit={submit} noValidate>
      <div className="form-heading"><p className="eyebrow">LET’S TALK</p><h2>Ask us about this piece</h2><p>Our team will get back to you with the details.</p></div>
      <label>Name<input autoComplete="name" value={values.name} maxLength={100} onChange={(event) => setValues({ ...values, name: event.target.value })} required /></label>
      <label>Email<input type="email" autoComplete="email" value={values.email} maxLength={254} onChange={(event) => setValues({ ...values, email: event.target.value })} required /></label>
      <label>Message<textarea rows={4} value={values.message} maxLength={2000} onChange={(event) => setValues({ ...values, message: event.target.value })} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button--dark button--full" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send enquiry'} <span aria-hidden="true">→</span></button>
    </form>
  );
}
