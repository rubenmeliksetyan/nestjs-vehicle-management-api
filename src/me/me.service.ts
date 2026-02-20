import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PickupRequest } from '../database/models/pickup-request.model';
import { PickupRequestStatus } from '../common/enums/pickup-request-status.enum';
import { CarsService } from '../cars/cars.service';
import { CreatePickupRequestDto } from './dto/create-pickup-request.dto';
import { PickupRequestResponseDto } from './dto/pickup-request-response.dto';

const PICKUP_RADIUS_KM = 10;

@Injectable()
export class MeService {
  constructor(
    @InjectModel(PickupRequest)
    private readonly pickupRequestModel: typeof PickupRequest,
    private readonly carsService: CarsService,
  ) {}

  async requestPickup(
    userId: number,
    dto: CreatePickupRequestDto,
  ): Promise<PickupRequestResponseDto> {
    const nearestCars = await this.carsService.getNearestCars(
      dto.latitude,
      dto.longitude,
      PICKUP_RADIUS_KM,
    );
    const carInRange = nearestCars.some((c) => c.id === dto.carId);
    if (!carInRange) {
      throw new BadRequestException('Car is not within 10km of your location');
    }
    const request = await this.pickupRequestModel.create({
      userId,
      carId: dto.carId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: PickupRequestStatus.PENDING,
    });
    return this.toResponse(request);
  }

  private toResponse(request: PickupRequest): PickupRequestResponseDto {
    return {
      id: request.id,
      userId: request.userId,
      carId: request.carId,
      latitude: Number(request.latitude),
      longitude: Number(request.longitude),
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}
