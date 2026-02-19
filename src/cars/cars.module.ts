import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { Car } from '../database/models/car.model';
import { CarImage } from '../database/models/car-image.model';
import { Category } from '../database/models/category.model';
import { Tag } from '../database/models/tag.model';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([Car, CarImage, Category, Tag]),
  ],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
