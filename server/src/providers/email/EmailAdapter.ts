import type { EnquiryNotification } from '../../models/product.js';

export interface EmailAdapter {
  sendEnquiryNotification(input: EnquiryNotification): Promise<void>;
}

export class ConsoleEmailAdapter implements EmailAdapter {
  async sendEnquiryNotification(input: EnquiryNotification): Promise<void> {
    // Avoid putting customer contact details or free text into persistent logs.
    console.info('Product enquiry received', { productId: input.product.id, productTitle: input.product.title });
  }
}
