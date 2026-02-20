import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { CarsModule } from '../cars/cars.module';
import { PickupRequest } from '../database/models/pickup-request.model';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [
    AuthModule,
    CarsModule,
    SequelizeModule.forFeature([PickupRequest]),
  ],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
