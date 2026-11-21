import type { EmailConfig } from '../../config/config.js';
import type { EmailAdapter } from './EmailAdapter.js';
import { ConsoleEmailAdapter } from './EmailAdapter.js';
import { SmtpEmailAdapter } from './SmtpEmailAdapter.js';

export function createEmailAdapter(config: EmailConfig): EmailAdapter {
  return config.adapter === 'smtp' ? new SmtpEmailAdapter(config) : new ConsoleEmailAdapter();
}
