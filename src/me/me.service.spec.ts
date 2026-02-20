import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { PickupRequest } from '../database/models/pickup-request.model';
import { CarsService } from '../cars/cars.service';
import { MeService } from './me.service';

describe('MeService', () => {
  let service: MeService;
  let pickupRequestModel: { create: jest.Mock };
  let carsService: { getNearestCars: jest.Mock };

  const mockPickupRequest = {
    id: 1,
    userId: 1,
    carId: 1,
    latitude: 52.52,
    longitude: 13.405,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    pickupRequestModel = {
      create: jest.fn().mockResolvedValue(mockPickupRequest),
    };
    carsService = {
      getNearestCars: jest.fn().mockResolvedValue([
        { id: 1, make: 'Toyota', model: 'Camry', distanceKm: 2.5 },
        { id: 2, make: 'Honda', model: 'Civic', distanceKm: 5.1 },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeService,
        {
          provide: getModelToken(PickupRequest),
          useValue: pickupRequestModel,
        },
        {
          provide: CarsService,
          useValue: carsService,
        },
      ],
    }).compile();

    service = module.get(MeService);
  });

  describe('requestPickup', () => {
    const dto = {
      carId: 1,
      latitude: 52.52,
      longitude: 13.405,
    };

    it('creates pickup request when car is within 10km', async () => {
      const result = await service.requestPickup(1, dto);

      expect(carsService.getNearestCars).toHaveBeenCalledWith(
        52.52,
        13.405,
        10,
      );
      expect(pickupRequestModel.create).toHaveBeenCalledWith({
        userId: 1,
        carId: 1,
        latitude: 52.52,
        longitude: 13.405,
        status: 'PENDING',
      });
      expect(result).toMatchObject({
        id: 1,
        userId: 1,
        carId: 1,
        latitude: 52.52,
        longitude: 13.405,
        status: 'PENDING',
      });
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('throws BadRequestException when car is not within 10km', async () => {
      carsService.getNearestCars.mockResolvedValue([
        { id: 2, make: 'Honda', model: 'Civic', distanceKm: 5.1 },
      ]);

      await expect(service.requestPickup(1, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.requestPickup(1, dto)).rejects.toThrow(
        'Car is not within 10km of your location',
      );
      expect(pickupRequestModel.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no cars in range', async () => {
      carsService.getNearestCars.mockResolvedValue([]);

      await expect(
        service.requestPickup(1, { ...dto, carId: 1 }),
      ).rejects.toThrow(BadRequestException);
      expect(pickupRequestModel.create).not.toHaveBeenCalled();
    });

    it('creates request for second car in nearest list', async () => {
      await service.requestPickup(2, { ...dto, carId: 2 });

      expect(pickupRequestModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ carId: 2 }),
      );
    });
  });
});
