import nodemailer, { type Transporter } from 'nodemailer';
import type { EnquiryNotification } from '../../models/product.js';
import type { EmailAdapter } from './EmailAdapter.js';
import type { EmailConfig } from '../../config/config.js';

type SmtpConfig = Extract<EmailConfig, { adapter: 'smtp' }>;

export class SmtpEmailAdapter implements EmailAdapter {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(config.username && config.password
        ? { auth: { user: config.username, pass: config.password } }
        : {}),
    });
  }

  async sendEnquiryNotification(input: EnquiryNotification): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject: `Product enquiry: ${input.product.title}`,
      text: [
        `Product: ${input.product.title} (ID ${input.product.id})`,
        `Name: ${input.customerName}`,
        `Email: ${input.customerEmail}`,
        '',
        input.message,
      ].join('\n'),
    });
  }
}
