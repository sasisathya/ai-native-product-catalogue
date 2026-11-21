import { Router } from 'express';
import { z } from 'zod';
import type { ProductController } from '../controllers/ProductController.js';

const idSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).refine(Number.isSafeInteger);
const categorySchema = z.string().trim().min(1).max(100);
const searchSchema = z.string().trim().min(1).max(100);
const enquirySchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(2000),
}).strict();

function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join('.') || 'request', issue.message]));
    throw Object.assign(new Error('Request validation failed'), { status: 400, code: 'VALIDATION_ERROR', fields });
  }
  return parsed.data;
}

export function createProductRoutes(controller: ProductController): Router {
  const router = Router();
  router.get('/products/featured', controller.featured);
  router.get('/categories', controller.categories);
  router.get('/categories/:category/products', (req, _res, next) => {
    try { req.params.category = validate(categorySchema, req.params.category); next(); } catch (error) { next(error); }
  }, controller.categoryProducts);
  router.get('/products/search', (req, _res, next) => {
    try {
      const parsed = validate(z.object({ q: searchSchema }).strict(), req.query);
      req.query.q = parsed.q;
      next();
    } catch (error) { next(error); }
  }, controller.search);
  router.get('/products/:id', (req, _res, next) => {
    try { validate(idSchema, req.params.id); next(); } catch (error) { next(error); }
  }, controller.detail);
  router.post('/enquiries', (req, _res, next) => {
    try { req.body = validate(enquirySchema, req.body); next(); } catch (error) { next(error); }
  }, controller.enquiry);
  return router;
}
