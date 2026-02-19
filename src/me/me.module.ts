import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CarsModule } from '../cars/cars.module';
import { MeController } from './me.controller';

@Module({
  imports: [AuthModule, CarsModule],
  controllers: [MeController],
})
export class MeModule {}
