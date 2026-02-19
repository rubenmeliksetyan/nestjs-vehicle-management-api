export interface SendMailOptions {
  to: string;
  subject: string;
  body: string;
}

export interface MailAdapter {
  send(options: SendMailOptions): Promise<void>;
}
