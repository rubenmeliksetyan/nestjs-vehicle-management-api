import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { User } from '../database/models/user.model';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [forwardRef(() => AuthModule), SequelizeModule.forFeature([User])],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [SequelizeModule],
})
export class UsersModule {}
