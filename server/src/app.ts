import express from 'express';
import type { Express } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AppConfig } from './config/config.js';
import { loadConfig } from './config/config.js';
import { ProductService } from './services/ProductService.js';
import { EnquiryService } from './services/EnquiryService.js';
import { FakeStoreProductProvider } from './providers/product/FakeStoreProductProvider.js';
import type { ProductProvider } from './providers/product/ProductProvider.js';
import type { EmailAdapter } from './providers/email/EmailAdapter.js';
import { createEmailAdapter } from './providers/email/createEmailAdapter.js';
import { ProductController } from './controllers/ProductController.js';
import { createProductRoutes } from './routes/ProductRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export interface AppDependencies {
  config?: AppConfig;
  productProvider?: ProductProvider;
  emailAdapter?: EmailAdapter;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const config = dependencies.config ?? loadConfig();
  const provider = dependencies.productProvider ?? new FakeStoreProductProvider(config.fakeStoreBaseUrl, config.providerTimeoutMs);
  const products = new ProductService(provider, config.featuredProductIds);
  const enquiries = new EnquiryService(products, dependencies.emailAdapter ?? createEmailAdapter(config.email));
  const controller = new ProductController(products, enquiries);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api', createProductRoutes(controller));

  const clientDist = process.env.CLIENT_DIST_DIR ?? resolve(process.cwd(), '../client/dist');
  const clientIndex = resolve(clientDist, 'index.html');
  if (existsSync(clientIndex)) {
    app.use(express.static(clientDist, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path === '/health' || req.path === '/api' || req.path.startsWith('/api/') || !req.accepts('html')) {
        next();
        return;
      }
      res.sendFile(clientIndex, (error) => { if (error) next(error); });
    });
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
