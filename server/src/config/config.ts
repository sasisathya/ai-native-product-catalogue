export interface AppConfig {
  port: number;
  fakeStoreBaseUrl: string;
  providerTimeoutMs: number;
  featuredProductIds: number[];
  email: EmailConfig;
}

export type EmailConfig =
  | { adapter: 'console' }
  | {
    adapter: 'smtp';
    host: string;
    port: number;
    secure: boolean;
    username?: string;
    password?: string;
    from: string;
    to: string;
  };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const featuredProductIds = (env.FEATURED_PRODUCT_IDS ?? '1,2,3,4,5')
    .split(',')
    .map((value) => Number(value.trim()));
  if (featuredProductIds.length !== 5 || featuredProductIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(featuredProductIds).size !== 5) {
    throw new Error('FEATURED_PRODUCT_IDS must contain exactly five distinct positive integers');
  }
  const port = Number(env.PORT ?? 4000);
  const providerTimeoutMs = Number(env.PROVIDER_TIMEOUT_MS ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  if (!Number.isInteger(providerTimeoutMs) || providerTimeoutMs < 1 || providerTimeoutMs > 120_000) {
    throw new Error('PROVIDER_TIMEOUT_MS must be between 1 and 120000');
  }
  const email = loadEmailConfig(env);
  return {
    port,
    fakeStoreBaseUrl: env.FAKE_STORE_API_BASE_URL ?? 'https://fakestoreapi.com',
    providerTimeoutMs,
    featuredProductIds,
    email,
  };
}

function loadEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const adapter = env.EMAIL_ADAPTER ?? 'console';
  if (adapter === 'console') return { adapter };
  if (adapter !== 'smtp') throw new Error('EMAIL_ADAPTER must be console or smtp');

  const host = env.SMTP_HOST?.trim();
  const from = env.EMAIL_FROM?.trim();
  const to = env.EMAIL_TO?.trim();
  const port = Number(env.SMTP_PORT ?? 587);
  const secureRaw = env.SMTP_SECURE ?? 'false';
  if (!host || !from || !to) throw new Error('SMTP_HOST, EMAIL_FROM, and EMAIL_TO are required when EMAIL_ADAPTER=smtp');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid TCP port');
  if (secureRaw !== 'true' && secureRaw !== 'false') throw new Error('SMTP_SECURE must be true or false');
  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASS)) throw new Error('SMTP_USER and SMTP_PASS must be set together');

  return {
    adapter,
    host,
    port,
    secure: secureRaw === 'true',
    ...(env.SMTP_USER ? { username: env.SMTP_USER } : {}),
    ...(env.SMTP_PASS ? { password: env.SMTP_PASS } : {}),
    from,
    to,
  };
}
