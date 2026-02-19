import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth';
import { CarsService } from '../cars/cars.service';
import { NearestCarsQueryDto } from './dto/nearest-cars-query.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly carsService: CarsService) {}

  @Get('nearest-cars')
  nearestCars(@Query() query: NearestCarsQueryDto) {
    return this.carsService.getNearestCars(
      query.latitude,
      query.longitude,
      query.radiusKm ?? 10,
    );
  }
}
