import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth';
import { CurrentUser } from '../auth';
import { User } from '../database/models/user.model';
import { CarsService } from '../cars/cars.service';
import { MeService } from './me.service';
import { NearestCarsQueryDto } from './dto/nearest-cars-query.dto';
import { CreatePickupRequestDto } from './dto/create-pickup-request.dto';

@ApiTags('me')
@ApiBearerAuth('access-token')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly carsService: CarsService,
    private readonly meService: MeService,
  ) {}

  @Get('nearest-cars')
  nearestCars(@Query() query: NearestCarsQueryDto) {
    return this.carsService.getNearestCars(
      query.latitude,
      query.longitude,
      query.radiusKm ?? 10,
    );
  }

  @Post('request-pickup')
  requestPickup(
    @CurrentUser() user: User,
    @Body() dto: CreatePickupRequestDto,
  ) {
    return this.meService.requestPickup(user.id, dto);
  }
}
