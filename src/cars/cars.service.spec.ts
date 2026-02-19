import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Car } from '../database/models/car.model';
import { CarImage } from '../database/models/car-image.model';
import { Category } from '../database/models/category.model';
import { Tag } from '../database/models/tag.model';
import { CarsService } from './cars.service';

describe('CarsService', () => {
  let service: CarsService;
  let carModel: {
    findByPk: jest.Mock;
    findAll: jest.Mock;
    create: jest.Mock;
    sequelize: { transaction: jest.Mock };
  };
  let carImageModel: {
    bulkCreate: jest.Mock;
    destroy: jest.Mock;
  };
  let categoryModel: { findByPk: jest.Mock };
  let tagModel: { findAll: jest.Mock };
  let mockCar: ReturnType<typeof createMockCar>;
  let mockTransaction: ReturnType<typeof createMockTransaction>;

  const mockCategory = {
    id: 1,
    name: 'Sedan',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTag = {
    id: 1,
    name: 'Eco',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createMockCar(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Blue',
      price: 25000,
      mileage: 10000,
      description: 'Test car',
      categoryId: 1,
      latitude: 40.7128,
      longitude: -74.006,
      createdAt: new Date(),
      updatedAt: new Date(),
      $set: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  function createMockTransaction() {
    return {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
  }

  beforeEach(async () => {
    mockTransaction = createMockTransaction();
    mockCar = createMockCar({
      category: mockCategory,
      images: [],
      tags: [],
    });

    carModel = {
      findByPk: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(mockCar),
      sequelize: {
        transaction: jest.fn().mockResolvedValue(mockTransaction),
      },
    };
    carImageModel = {
      bulkCreate: jest.fn().mockResolvedValue([]),
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    categoryModel = {
      findByPk: jest.fn().mockResolvedValue(mockCategory),
    };
    tagModel = {
      findAll: jest.fn().mockResolvedValue([mockTag]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarsService,
        {
          provide: getModelToken(Car),
          useValue: carModel,
        },
        {
          provide: getModelToken(CarImage),
          useValue: carImageModel,
        },
        {
          provide: getModelToken(Category),
          useValue: categoryModel,
        },
        {
          provide: getModelToken(Tag),
          useValue: tagModel,
        },
      ],
    }).compile();

    service = module.get(CarsService);
  });

  describe('create', () => {
    const createDto = {
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Blue',
      price: 25000,
      mileage: 10000,
      categoryId: 1,
      latitude: 40.7128,
      longitude: -74.006,
    };

    it('creates car with category', async () => {
      carModel.findByPk.mockImplementation(
        (_id: number, options?: { include?: unknown[] }) => {
          if (options?.include) {
            return Promise.resolve({
              ...mockCar,
              category: mockCategory,
              images: [],
              tags: [],
            });
          }
          return Promise.resolve(mockCar);
        },
      );

      const result = await service.create(createDto);

      expect(categoryModel.findByPk).toHaveBeenCalledWith(1);
      expect(carModel.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 1, make: 'Toyota', model: 'Camry' });
    });

    it('creates car with images and tags', async () => {
      const dtoWithRelations = {
        ...createDto,
        imageUrls: [
          'http://example.com/img1.jpg',
          'http://example.com/img2.jpg',
        ],
        tagIds: [1],
      };
      carModel.findByPk.mockResolvedValue({
        ...mockCar,
        category: mockCategory,
        images: [],
        tags: [mockTag],
      });

      await service.create(dtoWithRelations);

      expect(carImageModel.bulkCreate).toHaveBeenCalled();
      expect(mockCar.$set).toHaveBeenCalledWith(
        'tags',
        [1],
        expect.any(Object),
      );
    });

    it('throws NotFoundException when category not found', async () => {
      categoryModel.findByPk.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(carModel.sequelize.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when tag not found', async () => {
      const dtoWithTags = { ...createDto, tagIds: [999] };
      tagModel.findAll.mockResolvedValue([]);

      await expect(service.create(dtoWithTags)).rejects.toThrow(
        BadRequestException,
      );
      expect(carModel.sequelize.transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns cars with relationships', async () => {
      const cars = [
        { ...mockCar, category: mockCategory, images: [], tags: [] },
      ];
      carModel.findAll.mockResolvedValue(cars);

      const result = await service.findAll();

      expect(carModel.findAll).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.arrayContaining return type in test
        include: expect.arrayContaining([
          expect.objectContaining({ model: Category }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ]),
        order: [['createdAt', 'DESC']],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns car with relationships', async () => {
      carModel.findByPk.mockResolvedValue({
        ...mockCar,
        category: mockCategory,
        images: [],
        tags: [],
      });

      const result = await service.findOne(1);

      expect(carModel.findByPk).toHaveBeenCalledWith(1, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.arrayContaining return type in test
        include: expect.arrayContaining([
          expect.objectContaining({ model: Category }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ]),
      });
      expect(result).toMatchObject({ id: 1, make: 'Toyota' });
    });

    it('throws NotFoundException when not found', async () => {
      carModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates car fields', async () => {
      carModel.findByPk.mockImplementation(
        (_id: number, options?: { include?: unknown[] }) => {
          if (options?.include) {
            return Promise.resolve({
              ...mockCar,
              category: mockCategory,
              images: [],
              tags: [],
            });
          }
          return Promise.resolve(mockCar);
        },
      );

      await service.update(1, { make: 'Honda' });

      expect(mockCar.make).toBe('Honda');
      expect(mockCar.save).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('replaces images when imageUrls provided', async () => {
      carModel.findByPk.mockImplementation(
        (_id: number, options?: { include?: unknown[] }) => {
          if (options?.include) {
            return Promise.resolve({
              ...mockCar,
              category: mockCategory,
              images: [],
              tags: [],
            });
          }
          return Promise.resolve(mockCar);
        },
      );

      await service.update(1, { imageUrls: ['http://example.com/new.jpg'] });

      expect(carImageModel.destroy).toHaveBeenCalled();
      expect(carImageModel.bulkCreate).toHaveBeenCalled();
    });

    it('replaces tags when tagIds provided', async () => {
      carModel.findByPk.mockImplementation(
        (_id: number, options?: { include?: unknown[] }) => {
          if (options?.include) {
            return Promise.resolve({
              ...mockCar,
              category: mockCategory,
              images: [],
              tags: [],
            });
          }
          return Promise.resolve(mockCar);
        },
      );
      tagModel.findAll.mockResolvedValue([
        { ...mockTag, id: 1 },
        { ...mockTag, id: 2 },
      ]);

      await service.update(1, { tagIds: [1, 2] });

      expect(mockCar.$set).toHaveBeenCalledWith(
        'tags',
        [1, 2],
        expect.any(Object),
      );
    });

    it('throws NotFoundException when car not found', async () => {
      carModel.findByPk.mockResolvedValue(null);

      await expect(service.update(999, { make: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when category not found', async () => {
      carModel.findByPk.mockResolvedValue(mockCar);
      categoryModel.findByPk.mockResolvedValue(null);

      await expect(service.update(1, { categoryId: 999 })).rejects.toThrow(
        NotFoundException,
      );
      expect(carModel.sequelize.transaction).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('destroys car when found', async () => {
      carModel.findByPk.mockResolvedValue(mockCar);

      await service.remove(1);

      expect(mockCar.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      carModel.findByPk.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
