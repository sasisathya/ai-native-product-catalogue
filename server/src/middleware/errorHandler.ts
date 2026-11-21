import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } });
    return;
  }
  if (error?.status === 400 && error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } });
    return;
  }
  if (error?.status === 413 && error?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    return;
  }
  if (error?.status === 415 && (error?.type === 'charset.unsupported' || error?.type === 'encoding.unsupported')) {
    res.status(415).json({ error: { code: 'UNSUPPORTED_REQUEST_ENCODING', message: 'Request encoding is not supported' } });
    return;
  }
  if (error?.status === 400 && error?.code === 'VALIDATION_ERROR') {
    res.status(400).json({ error: { code: error.code, message: error.message, fields: error.fields } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
