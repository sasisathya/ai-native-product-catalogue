export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating?: { rate: number; count: number };
}

export interface CreateEnquiryRequest {
  productId: number;
  name: string;
  email: string;
  message: string;
}

export interface EnquiryNotification {
  product: Pick<Product, 'id' | 'title'>;
  customerName: string;
  customerEmail: string;
  message: string;
}
