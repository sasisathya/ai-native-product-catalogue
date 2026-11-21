import { describe, expect, it, vi } from 'vitest';
import { ConsoleEmailAdapter } from '../../src/providers/email/EmailAdapter.js';

describe('ConsoleEmailAdapter', () => {
  it('does not write customer contact details or message content to logs', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await new ConsoleEmailAdapter().sendEnquiryNotification({
      product: { id: 4, title: 'Sample product' },
      customerName: 'Private Customer',
      customerEmail: 'private@example.com',
      message: 'Private enquiry content',
    });

    expect(log).toHaveBeenCalledWith('Product enquiry received', { productId: 4, productTitle: 'Sample product' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('Private Customer');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private@example.com');
    expect(JSON.stringify(log.mock.calls)).not.toContain('Private enquiry content');
    log.mockRestore();
  });
});
