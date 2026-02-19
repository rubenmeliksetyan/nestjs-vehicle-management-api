import { Module } from '@nestjs/common';
import { ConsoleMailAdapter } from './adapters/console-mail.adapter';
import { MAIL_ADAPTER } from './mail.constants';
import { MailService } from './mail.service';

@Module({
  providers: [
    MailService,
    {
      provide: MAIL_ADAPTER,
      useClass: ConsoleMailAdapter,
    },
  ],
  exports: [MailService],
})
export class MailModule {}
