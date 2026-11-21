import { describe, expect, it } from 'vitest';
import { ProductService } from '../../src/services/ProductService.js';
import type { Product } from '../../src/models/product.js';
import type { ProductProvider } from '../../src/providers/product/ProductProvider.js';

const products: Product[] = [1, 2, 3, 4, 5, 6].map((id) => ({
  id, title: `Product ${id}`, description: id === 6 ? 'Soft cotton fabric' : 'A useful item',
  price: id, category: id === 6 ? 'clothing' : 'jewelery', imageUrl: `/${id}.jpg`,
}));

function providerFixture(): ProductProvider {
  return {
    listProducts: async () => products,
    listCategories: async () => ['jewelery', 'clothing'],
    listByCategory: async (category) => products.filter((product) => product.category === category),
    getById: async (id) => products.find((product) => product.id === id) ?? null,
  };
}

describe('ProductService', () => {
  const service = new ProductService(providerFixture(), [1, 2, 3, 4, 5]);

  it('returns the five configured featured products in configured order', async () => {
    expect((await service.getFeatured()).map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('fails safely instead of returning fewer than five featured products', async () => {
    const incomplete = new ProductService({ ...providerFixture(), listProducts: async () => products.slice(0, 4) }, [1, 2, 3, 4, 5]);
    await expect(incomplete.getFeatured()).rejects.toMatchObject({ status: 502, code: 'FEATURED_PRODUCTS_UNAVAILABLE' });
  });

  it('splits category products into featured and additional products', async () => {
    const result = await service.getCategoryProducts('jewelery');
    expect(result.featured.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
    expect(result.additional).toEqual([]);
  });

  it('searches title, description, and category without case sensitivity', async () => {
    expect((await service.search('COTTON')).map(({ id }) => id)).toEqual([6]);
    expect((await service.search('JEWELERY')).map(({ id }) => id)).toHaveLength(5);
  });

  it('returns not found for an unknown category and product', async () => {
    await expect(service.getCategoryProducts('missing')).rejects.toMatchObject({ status: 404 });
    await expect(service.getProduct(999)).rejects.toMatchObject({ status: 404 });
  });
});
