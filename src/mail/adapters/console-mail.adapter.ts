import { Injectable } from '@nestjs/common';
import {
  MailAdapter,
  SendMailOptions,
} from '../interfaces/mail-adapter.interface';

@Injectable()
export class ConsoleMailAdapter implements MailAdapter {
  send(options: SendMailOptions): Promise<void> {
    console.log('[ConsoleMailAdapter]', {
      to: options.to,
      subject: options.subject,
      body: options.body,
    });
    return Promise.resolve();
  }
}
