import { Inject, Injectable } from '@nestjs/common';
import type { MailAdapter } from './interfaces/mail-adapter.interface';
import { SendMailOptions } from './interfaces/mail-adapter.interface';
import { MAIL_ADAPTER } from './mail.constants';

@Injectable()
export class MailService {
  constructor(@Inject(MAIL_ADAPTER) private readonly adapter: MailAdapter) {}

  async send(options: SendMailOptions): Promise<void> {
    await this.adapter.send(options);
  }

  async sendWelcome(to: string, fullName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome',
      body: `Hello ${fullName}, welcome to the service.`,
    });
  }
}
