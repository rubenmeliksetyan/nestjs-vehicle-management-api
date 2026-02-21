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

  const withGet = <T extends Record<string, unknown>>(
    o: T,
  ): T & { get: (k: string) => unknown } => ({
    ...o,
    get(key: string) {
      return (this as Record<string, unknown>)[key];
    },
  });
  const mockCategory = withGet({
    id: 1,
    name: 'Sedan',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const mockTag = withGet({
    id: 1,
    name: 'Eco',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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
      get(key: string) {
        return (this as Record<string, unknown>)[key];
      },
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
        transaction: jest
          .fn()
          .mockImplementation((cb?: (t: typeof mockTransaction) => unknown) => {
            if (typeof cb === 'function') {
              return Promise.resolve(cb(mockTransaction));
            }
            return Promise.resolve(mockTransaction);
          }),
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
      imageUrls: ['http://example.com/car.jpg'],
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
      const dtoWithTags = {
        ...createDto,
        imageUrls: ['http://example.com/car.jpg'],
        tagIds: [999],
      };
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

      await service.listPublic({ orderBy: undefined, search: 'Toyota' });

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

  describe('listGroupedByCategory', () => {
    it('returns cars grouped by category sorted by category name', async () => {
      const sedan = withGet({
        id: 1,
        name: 'Sedan',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const suv = withGet({
        id: 2,
        name: 'SUV',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const cars = [
        {
          ...mockCar,
          id: 1,
          categoryId: 2,
          category: suv,
          images: [],
          tags: [],
        },
        {
          ...mockCar,
          id: 2,
          categoryId: 1,
          category: sedan,
          images: [],
          tags: [],
        },
      ];
      carModel.findAll.mockResolvedValue(cars);

      const result = await service.listGroupedByCategory();

      expect(carModel.findAll).toHaveBeenCalledWith({
        include: [
          expect.objectContaining({
            model: Category,
            as: 'category',
            required: true,
          }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ],
        order: [['createdAt', 'DESC']],
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.category.name).toBe('Sedan');
      expect(result[1]?.category.name).toBe('SUV');
      expect(result[0]?.cars).toHaveLength(1);
      expect(result[1]?.cars).toHaveLength(1);
      expect(result[0]).toHaveProperty('totalCount', 1);
      expect(result[1]).toHaveProperty('totalCount', 1);
    });

    it('returns empty array when no cars', async () => {
      carModel.findAll.mockResolvedValue([]);

      const result = await service.listGroupedByCategory();

      expect(result).toEqual([]);
    });
  });

  describe('getNearestCars', () => {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment -- service from module.get() in tests */
    it('builds DB distance query and maps distanceKm', async () => {
      const userLat = 40.7128;
      const userLon = -74.006;
      const nearestCar = {
        ...mockCar,
        id: 1,
        latitude: 40.72,
        longitude: -74.0,
        distanceMeters: 1250,
        category: mockCategory,
        images: [],
        tags: [],
      };
      const secondNearestCar = {
        ...mockCar,
        id: 2,
        latitude: 40.74,
        longitude: -73.98,
        distanceMeters: 3500,
        category: mockCategory,
        images: [],
        tags: [],
      };
      carModel.findAll.mockResolvedValue([nearestCar, secondNearestCar]);

      const result = await service.getNearestCars(userLat, userLon, 10);

      type NearestQueryArgs = {
        attributes?: { include?: unknown[] };
        where?: Record<symbol, unknown[]>;
        include?: unknown[];
        order?: unknown[];
      };
      const findAllCalls = carModel.findAll.mock.calls as unknown as Array<
        [NearestQueryArgs]
      >;
      const findAllArgs = findAllCalls[0][0];
      expect(findAllArgs).toMatchObject({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Category }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ]),
        attributes: expect.objectContaining({
          include: expect.any(Array),
        }),
        where: expect.any(Object),
        order: [[expect.any(Object), 'ASC']],
      });
      const andClauses = (findAllArgs.where as Record<symbol, unknown[]>)[
        Op.and
      ];
      expect(andClauses).toHaveLength(3);
      expect(andClauses[0]).toMatchObject({
        latitude: { [Op.between]: expect.any(Array) },
      });
      expect(andClauses[1]).toMatchObject({
        longitude: { [Op.between]: expect.any(Array) },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1 });
      expect(result[0]?.distanceKm).toBe(1.25);
      expect(result[1]?.distanceKm).toBe(3.5);
    });

    it('uses default radius 10km', async () => {
      carModel.findAll.mockResolvedValue([]);

      await service.getNearestCars(40.7128, -74.006);

      type DefaultRadiusQueryArgs = {
        where?: Record<symbol, unknown[]>;
      };
      const findAllCalls = carModel.findAll.mock.calls as unknown as Array<
        [DefaultRadiusQueryArgs]
      >;
      const findAllArgs = findAllCalls[0][0];
      const andClauses = (findAllArgs.where as Record<symbol, unknown[]>)[
        Op.and
      ];
      const latitudeRange = (
        andClauses[0] as { latitude: { [Op.between]: [number, number] } }
      ).latitude[Op.between];
      expect(latitudeRange[0]).toBeLessThan(40.7128);
      expect(latitudeRange[1]).toBeGreaterThan(40.7128);
    });

    it('returns empty array when DB returns no cars', async () => {
      carModel.findAll.mockResolvedValue([]);

      const result = await service.getNearestCars(40.7128, -74.006, 10);

      expect(result).toEqual([]);
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  });

  describe('findAll', () => {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment -- service from module.get() in tests */
    it('returns cars with relationships using default ordering', async () => {
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

    it('returns cars with custom ordering', async () => {
      const cars = [
        { ...mockCar, category: mockCategory, images: [], tags: [] },
      ];
      carModel.findAll.mockResolvedValue(cars);

      const result = await service.findAll({
        orderBy: 'price',
        orderDirection: 'ASC',
      });

      expect(carModel.findAll).toHaveBeenCalledWith({
        include: expect.arrayContaining([
          expect.objectContaining({ model: Category }),
          expect.objectContaining({ model: CarImage }),
          expect.objectContaining({ model: Tag }),
        ]),
        order: [['price', 'ASC']],
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
