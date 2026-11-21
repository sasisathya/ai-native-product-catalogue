import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderError } from '../../src/errors/AppError.js';
import { FakeStoreProductProvider } from '../../src/providers/product/FakeStoreProductProvider.js';

const fakeProduct = {
  id: 7,
  title: 'Sample item',
  description: 'A sample description',
  price: 19.99,
  category: 'home goods',
  image: 'https://images.example.test/item.jpg',
  rating: { rate: 4.5, count: 12 },
};

afterEach(() => vi.unstubAllGlobals());

describe('FakeStoreProductProvider', () => {
  it('maps provider fields to the application product shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([fakeProduct]), { status: 200 })));
    const products = await new FakeStoreProductProvider().listProducts();
    expect(products).toEqual([{
      id: 7,
      title: 'Sample item',
      description: 'A sample description',
      price: 19.99,
      category: 'home goods',
      imageUrl: 'https://images.example.test/item.jpg',
      rating: { rate: 4.5, count: 12 },
    }]);
  });

  it('encodes category path segments', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await new FakeStoreProductProvider('https://api.example.test').listByCategory('home goods/lighting');
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/products/category/home%20goods%2Flighting', expect.anything());
  });

  it.each([
    ['non-success status', async () => new Response('upstream secret', { status: 503 })],
    ['invalid JSON', async () => new Response('{broken', { status: 200 })],
    ['network failure', async () => { throw new Error('private upstream hostname'); }],
  ])('maps %s to a sanitized provider error', async (_label, response) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(response));
    await expect(new FakeStoreProductProvider('https://private.example.test').listProducts())
      .rejects.toMatchObject({ name: 'ProviderError', message: 'Product provider request failed' });
  });

  it('aborts a request that exceeds its timeout and returns a sanitized error', async () => {
    const fetchMock = vi.fn((_url: string, options: { signal: AbortSignal }) => new Promise<Response>((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(new FakeStoreProductProvider('https://private.example.test', 5).listProducts())
      .rejects.toBeInstanceOf(ProviderError);
    expect(fetchMock.mock.calls[0]?.[1]?.signal.aborted).toBe(true);
  });

  it('rejects malformed product payloads rather than returning incomplete catalogue data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ ...fakeProduct, image: undefined }]), { status: 200 })));
    await expect(new FakeStoreProductProvider().listProducts()).rejects.toBeInstanceOf(ProviderError);
  });

  it('returns null when a valid detail lookup has no product', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 200 })));
    await expect(new FakeStoreProductProvider().getById(999)).resolves.toBeNull();
  });
});
