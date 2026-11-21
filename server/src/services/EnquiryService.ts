import type { CreateEnquiryRequest } from '../models/product.js';
import type { EmailAdapter } from '../providers/email/EmailAdapter.js';
import { AppError } from '../errors/AppError.js';
import { ProductService } from './ProductService.js';

export class EnquiryService {
  constructor(private readonly products: ProductService, private readonly email: EmailAdapter) {}

  async submit(input: CreateEnquiryRequest): Promise<void> {
    const product = await this.products.getProduct(input.productId);
    try {
      await this.email.sendEnquiryNotification({
        product: { id: product.id, title: product.title },
        customerName: input.name,
        customerEmail: input.email,
        message: input.message,
      });
    } catch {
      throw new AppError(502, 'ENQUIRY_NOTIFICATION_FAILED', 'Could not send enquiry notification');
    }
  }
}
