import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { catalogueApi } from './services/catalogueApi';
import type { Product } from './types/catalogue';

vi.mock('./services/catalogueApi', () => ({
  catalogueApi: {
    getCategories: vi.fn(),
    getFeatured: vi.fn(),
    getCategoryProducts: vi.fn(),
    searchProducts: vi.fn(),
    getProduct: vi.fn(),
    createEnquiry: vi.fn(),
  },
}));

const products: Product[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  title: `Sample product ${index + 1}`,
  description: `Description for product ${index + 1}`,
  price: 10 + index,
  category: 'jewelery',
  imageUrl: 'https://images.example.test/product.jpg',
}));

function renderRoute(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(catalogueApi.getCategories).mockResolvedValue({ categories: ['jewelery'] });
  vi.mocked(catalogueApi.getFeatured).mockResolvedValue({ products });
  vi.mocked(catalogueApi.getCategoryProducts).mockResolvedValue({ category: 'jewelery', featured: products.slice(0, 2), additional: products.slice(2) });
  vi.mocked(catalogueApi.searchProducts).mockResolvedValue({ query: 'sample', products: [products[0]!] });
  vi.mocked(catalogueApi.getProduct).mockResolvedValue({ product: products[0]! });
  vi.mocked(catalogueApi.createEnquiry).mockResolvedValue({ message: 'Enquiry received' });
});

afterEach(cleanup);

describe('frontend routes', () => {
  it('renders the home page with five featured products', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { name: 'Featured finds' })).toBeTruthy();
    expect(await screen.findByText('Sample product 5')).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(catalogueApi.getFeatured).toHaveBeenCalledOnce();
  });

  it('renders category navigation and featured/additional listings', async () => {
    renderRoute('/categories/jewelery');
    expect(await screen.findByRole('heading', { name: 'Jewelery' })).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Featured in Jewelery' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Additional finds' })).toBeTruthy();
    expect(await screen.findByText('Sample product 5')).toBeTruthy();
  });

  it('renders search results from the query string', async () => {
    renderRoute('/search?q=sample');
    expect(await screen.findByText(/Showing matches for/)).toBeTruthy();
    expect(await screen.findByText('Sample product 1')).toBeTruthy();
    expect(catalogueApi.searchProducts).toHaveBeenCalledWith('sample');
  });

  it('renders product details and completes a valid enquiry to Thank You', async () => {
    renderRoute('/products/1');
    expect(await screen.findByRole('heading', { name: 'About this find' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please send more details.' } });
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect(await screen.findByRole('heading', { name: /Thank you/ })).toBeTruthy();
    expect(catalogueApi.createEnquiry).toHaveBeenCalledWith({
      productId: 1, name: 'Ada', email: 'ada@example.com', message: 'Please send more details.',
    });
  });

  it('does not submit an invalid enquiry and displays validation feedback', async () => {
    renderRoute('/products/1');
    await screen.findByRole('heading', { name: 'About this find' });
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(catalogueApi.createEnquiry).not.toHaveBeenCalled();
  });

  it('renders the Thank You page directly and a not-found route', async () => {
    const { unmount } = renderRoute('/thank-you');
    expect(screen.getByRole('heading', { name: /Thank you/ })).toBeTruthy();
    unmount();
    renderRoute('/not-a-route');
    expect(screen.getByRole('heading', { name: 'This page wandered off.' })).toBeTruthy();
  });

  it('shows a recoverable error state when home data fails', async () => {
    vi.mocked(catalogueApi.getFeatured).mockRejectedValueOnce(new Error('Catalogue temporarily unavailable'));
    renderRoute('/');
    expect(await screen.findByText('Catalogue temporarily unavailable')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
