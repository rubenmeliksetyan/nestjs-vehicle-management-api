import { Controller, Get, Query } from '@nestjs/common';
import { CarsService } from './cars.service';
import { ListCarsQueryDto } from './dto/list-cars-query.dto';

@Controller('cars')
export class PublicCarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  list(@Query() query: ListCarsQueryDto) {
    return this.carsService.listPublic(query);
  }

  @Get('grouped-by-category')
  groupedByCategory() {
    return this.carsService.listGroupedByCategory();
  }
}
