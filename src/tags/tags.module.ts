import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { Tag } from '../database/models/tag.model';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [AuthModule, SequelizeModule.forFeature([Tag])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
