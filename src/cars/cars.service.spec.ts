import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';
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
    findAndCountAll: jest.Mock;
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
      findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] }),
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

  describe('listPublic', () => {
    it('returns paginated cars with default page and limit', async () => {
      const cars = [
        { ...mockCar, category: mockCategory, images: [], tags: [] },
      ];
      carModel.findAndCountAll.mockResolvedValue({ count: 1, rows: cars });

      const result = await service.listPublic({});

      expect(carModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
          distinct: true,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('applies search filter on make and model', async () => {
      carModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await service.listPublic({ search: 'Toyota' });

      expect(carModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining in test
          where: expect.objectContaining({
            [Op.or]: [
              { make: { [Op.like]: '%Toyota%' } },
              { model: { [Op.like]: '%Toyota%' } },
            ],
          }),
        }),
      );
    });

    it('applies categoryId filter', async () => {
      carModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await service.listPublic({ categoryId: 2 });

      expect(carModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining in test
          where: expect.objectContaining({ categoryId: 2 }),
        }),
      );
    });

    it('applies tagIds filter (ANY) with required join', async () => {
      carModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      await service.listPublic({ tagIds: [1, 2] });

      type IncludeItem = { as?: string; where?: unknown; required?: boolean };
      type FindAndCountOptions = { include?: IncludeItem[] };
      const firstCallArgs = carModel.findAndCountAll.mock
        .calls[0] as unknown as [FindAndCountOptions];
      const call = firstCallArgs[0];
      const tagInclude = call.include?.find(
        (inc: IncludeItem) => inc.as === 'tags',
      );
      expect(tagInclude).toBeDefined();
      expect(tagInclude?.where).toEqual({ id: { [Op.in]: [1, 2] } });
      expect(tagInclude?.required).toBe(true);
    });

    it('uses custom page and limit', async () => {
      carModel.findAndCountAll.mockResolvedValue({ count: 25, rows: [] });

      const result = await service.listPublic({ page: 2, limit: 5 });

      expect(carModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('findAll', () => {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment -- service from module.get() in tests */
    it('returns cars with relationships', async () => {
      const cars = [
        { ...mockCar, category: mockCategory, images: [], tags: [] },
      ];
      carModel.findAll.mockResolvedValue(cars);

      const result = await service.findAll();

      expect(carModel.findAll).toHaveBeenCalledWith({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Category }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ]),
        order: [['createdAt', 'DESC']],
      });
      expect(result).toHaveLength(1);
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  });

  describe('findOne', () => {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment -- service from module.get() in tests */
    it('returns car with relationships', async () => {
      carModel.findByPk.mockResolvedValue({
        ...mockCar,
        category: mockCategory,
        images: [],
        tags: [],
      });

      const result = await service.findOne(1);

      expect(carModel.findByPk).toHaveBeenCalledWith(1, {
        include: expect.arrayContaining([
          expect.objectContaining({ model: Category }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ]),
      });
      expect(result).toMatchObject({ id: 1, make: 'Toyota' });
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */

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
