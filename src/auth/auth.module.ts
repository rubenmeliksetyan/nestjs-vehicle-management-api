import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret = config.get<string>('jwt.secret');
        const expiresIn = config.get<string>('jwt.accessExpiresIn', '3600s');
        if (!secret) {
          throw new Error('JWT secret is required');
        }
        return {
          secret,
          signOptions: { expiresIn },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
