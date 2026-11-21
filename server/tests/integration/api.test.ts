import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import type { AppConfig } from '../../src/config/config.js';
import type { Product } from '../../src/models/product.js';
import type { ProductProvider } from '../../src/providers/product/ProductProvider.js';
import type { EmailAdapter } from '../../src/providers/email/EmailAdapter.js';

const items: Product[] = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1, title: `Product ${index + 1}`, description: 'A description', price: index + 1,
  category: index < 5 || index === 6 ? 'jewelery' : 'electronics', imageUrl: 'image.jpg',
}));
const config: AppConfig = { port: 4000, fakeStoreBaseUrl: 'unused', providerTimeoutMs: 100, featuredProductIds: [1, 2, 3, 4, 5], email: { adapter: 'console' } };
const emailAdapter: EmailAdapter = { sendEnquiryNotification: vi.fn(async () => undefined) };

function provider(): ProductProvider {
  return {
    listProducts: async () => items,
    listCategories: async () => ['jewelery', 'electronics'],
    listByCategory: async (category) => items.filter((product) => product.category === category),
    getById: async (id) => items.find((product) => product.id === id) ?? null,
  };
}

describe('catalogue API', () => {
  beforeEach(() => vi.clearAllMocks());
  const app = createApp({ config, productProvider: provider(), emailAdapter });

  it('serves exactly five featured products', async () => {
    const response = await request(app).get('/api/products/featured').expect(200);
    expect(response.body.products).toHaveLength(5);
  });

  it('exposes a lightweight health endpoint without requiring an upstream call', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
  });

  it('serves categories and separates category featured from additional products', async () => {
    await request(app).get('/api/categories').expect(200, { categories: ['jewelery', 'electronics'] });
    const response = await request(app).get('/api/categories/jewelery/products').expect(200);
    expect(response.body.featured.map((product: Product) => product.id)).toEqual([1, 2, 3, 4, 5]);
    expect(response.body.additional.map((product: Product) => product.id)).toEqual([7]);
    await request(app).get('/api/categories/missing/products').expect(404);
  });

  it('searches title, description, and category and validates query', async () => {
    const response = await request(app).get('/api/products/search?q=Jewelery').expect(200);
    expect(response.body.products).toHaveLength(6);
    expect((await request(app).get('/api/products/search?q=Product%202').expect(200)).body.products.map((product: Product) => product.id)).toEqual([2]);
    expect((await request(app).get('/api/products/search?q=DESCRIPTION').expect(200)).body.products).toHaveLength(7);
    await request(app).get('/api/products/search?q=%20%20').expect(400);
    await request(app).get('/api/products/search?q=ok&extra=no').expect(400);
  });

  it('returns product details and 404 for missing product', async () => {
    expect((await request(app).get('/api/products/2').expect(200)).body.product.id).toBe(2);
    await request(app).get('/api/products/0').expect(400);
    await request(app).get('/api/products/999999999999999999999999').expect(400);
    await request(app).get('/api/products/999').expect(404);
  });

  it('validates enquiries and sends notification for valid input', async () => {
    const body = { productId: 1, name: 'Ada', email: 'ada@example.com', message: 'Please tell me more.' };
    await request(app).post('/api/enquiries').send({ ...body, unknown: true }).expect(400);
    await request(app).post('/api/enquiries').send({ ...body, productId: 999 }).expect(404);
    await request(app).post('/api/enquiries').send(body).expect(201, { message: 'Enquiry received' });
    expect(emailAdapter.sendEnquiryNotification).toHaveBeenCalledOnce();
  });

  it('maps provider failures to a safe gateway error', async () => {
    const failingApp = createApp({ config, productProvider: { ...provider(), listProducts: async () => { throw new Error('private upstream URL'); } }, emailAdapter });
    const response = await request(failingApp).get('/api/products/featured').expect(502);
    expect(JSON.stringify(response.body)).not.toContain('private upstream URL');
    expect(response.body.error.code).toBe('PRODUCT_SOURCE_UNAVAILABLE');
  });

  it('maps failures from every provider endpoint to safe gateway responses', async () => {
    const failure = async (): Promise<never> => { throw new Error('sensitive upstream response'); };
    const failingApp = createApp({ config, productProvider: {
      listProducts: failure,
      listCategories: async () => ['jewelery'],
      listByCategory: failure,
      getById: failure,
    }, emailAdapter });
    const paths = ['/api/products/featured', '/api/categories/jewelery/products', '/api/products/search?q=gold', '/api/products/1'];
    for (const path of paths) {
      const response = await request(failingApp).get(path).expect(502);
      expect(JSON.stringify(response.body)).not.toContain('sensitive upstream response');
      expect(response.body.error.code).toBe('PRODUCT_SOURCE_UNAVAILABLE');
    }
    const categoriesFailApp = createApp({ config, productProvider: { ...provider(), listCategories: failure }, emailAdapter });
    await request(categoriesFailApp).get('/api/categories').expect(502);
  });

  it('reports email adapter failure without returning its private error', async () => {
    const failingEmail: EmailAdapter = { sendEnquiryNotification: async () => { throw new Error('smtp password or host'); } };
    const failingApp = createApp({ config, productProvider: provider(), emailAdapter: failingEmail });
    const response = await request(failingApp).post('/api/enquiries').send({
      productId: 1, name: 'Ada', email: 'ada@example.com', message: 'Question',
    }).expect(502);
    expect(response.body.error.code).toBe('ENQUIRY_NOTIFICATION_FAILED');
    expect(JSON.stringify(response.body)).not.toContain('smtp password or host');
  });

  it('rejects oversized request bodies with 413', async () => {
    await request(app).post('/api/enquiries').send({
      productId: 1, name: 'Ada', email: 'ada@example.com', message: 'x'.repeat(35_000),
    }).expect(413);
  });

  it('rejects unsupported JSON character encodings with 415', async () => {
    await request(app).post('/api/enquiries')
      .set('Content-Type', 'application/json; charset=unsupported-charset')
      .send('{"productId":1}')
      .expect(415);
  });

  it('uses centralized 404 and malformed JSON responses', async () => {
    await request(app).get('/api/missing').expect(404);
    await request(app).post('/api/enquiries').set('Content-Type', 'application/json').send('{broken').expect(400);
  });
});
