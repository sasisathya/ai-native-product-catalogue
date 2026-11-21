export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ProviderError extends Error {
  constructor() {
    super('Product provider request failed');
    this.name = 'ProviderError';
  }
}
