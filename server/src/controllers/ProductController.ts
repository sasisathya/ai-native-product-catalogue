import type { Request, Response, NextFunction } from 'express';
import type { ProductService } from '../services/ProductService.js';
import type { EnquiryService } from '../services/EnquiryService.js';

export class ProductController {
  constructor(private readonly products: ProductService, private readonly enquiries: EnquiryService) {}

  featured = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ products: await this.products.getFeatured() }); } catch (error) { next(error); }
  };

  categories = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ categories: await this.products.getCategories() }); } catch (error) { next(error); }
  };

  categoryProducts = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.products.getCategoryProducts(String(req.params.category))); } catch (error) { next(error); }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ query: req.query.q, products: await this.products.search(req.query.q as string) }); } catch (error) { next(error); }
  };

  detail = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ product: await this.products.getProduct(Number(req.params.id)) }); } catch (error) { next(error); }
  };

  enquiry = async (req: Request, res: Response, next: NextFunction) => {
    try { await this.enquiries.submit(req.body); res.status(201).json({ message: 'Enquiry received' }); } catch (error) { next(error); }
  };
}
