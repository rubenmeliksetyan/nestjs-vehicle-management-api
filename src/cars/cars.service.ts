import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction, WhereOptions, literal } from 'sequelize';
import { Car } from '../database/models/car.model';
import { CarImage } from '../database/models/car-image.model';
import { Category } from '../database/models/category.model';
import { Tag } from '../database/models/tag.model';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarResponseDto } from './dto/car-response.dto';
import { CategoryResponseDto } from '../categories/dto/category-response.dto';
import { ListCarsQueryDto } from './dto/list-cars-query.dto';
import { FindAllCarsQueryDto } from './dto/find-all-cars-query.dto';
import { PaginatedCarsResponseDto } from './dto/paginated-cars-response.dto';
import { CategoryGroupDto } from './dto/grouped-by-category-response.dto';
import { NearestCarResponseDto } from './dto/nearest-car-response.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectModel(Car)
    private readonly carModel: typeof Car,
    @InjectModel(CarImage)
    private readonly carImageModel: typeof CarImage,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Tag)
    private readonly tagModel: typeof Tag,
  ) {}

  async create(dto: CreateCarDto): Promise<CarResponseDto> {
    const category = await this.categoryModel.findByPk(dto.categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.tagIds && dto.tagIds.length > 0) {
      const tags = await this.tagModel.findAll({
        where: { id: dto.tagIds },
      });
      if (tags.length !== dto.tagIds.length) {
        throw new BadRequestException('One or more tags not found');
      }
    }

    const transaction = await this.carModel.sequelize!.transaction();

    try {
      const car = await this.carModel.create(
        {
          make: dto.make.trim(),
          model: dto.model.trim(),
          year: dto.year,
          color: dto.color.trim(),
          price: dto.price,
          mileage: dto.mileage,
          description: dto.description?.trim(),
          categoryId: dto.categoryId,
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
        { transaction },
      );

      if (dto.imageUrls && dto.imageUrls.length > 0) {
        await this.carImageModel.bulkCreate(
          dto.imageUrls.map((url) => ({
            carId: car.id,
            url: url.trim(),
          })),
          { transaction },
        );
      }

      if (dto.tagIds && dto.tagIds.length > 0) {
        await car.$set('tags', dto.tagIds, { transaction });
      }

      await transaction.commit();

      return this.findOne(car.id);
    } catch (err: unknown) {
      await transaction.rollback();
      throw err;
    }
  }

  async findAll(query: FindAllCarsQueryDto): Promise<CarResponseDto[]> {
    const { orderBy, orderDirection } = query;
    const cars = await this.carModel.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: CarImage, as: 'images' },
        { model: Tag, as: 'tags' },
      ],
      order: [[orderBy, orderDirection]],
    });
    return cars.map((car) => this.toResponse(car));
  }

  async listPublic(query: ListCarsQueryDto): Promise<PaginatedCarsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const searchTerm = query.search?.trim();
    const where: WhereOptions<Car> = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(searchTerm && {
        [Op.or]: [
          { make: { [Op.like]: `%${searchTerm}%` } },
          { model: { [Op.like]: `%${searchTerm}%` } },
        ],
      }),
    };

    const tagInclude =
      query.tagIds && query.tagIds.length > 0
        ? {
            model: Tag,
            as: 'tags' as const,
            where: { id: { [Op.in]: query.tagIds } },
            required: true,
          }
        : { model: Tag, as: 'tags' as const };

    const orderBy = query.orderBy ?? 'createdAt';
    const orderDirection: 'ASC' | 'DESC' = query.orderDirection ?? 'DESC';
    const { count, rows: cars } = await this.carModel.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category' },
        { model: CarImage, as: 'images' },
        tagInclude,
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);
    return {
      data: cars.map((car) => this.toResponse(car)),
      total: count,
      page,
      limit,
      totalPages,
    };
  }

  async listGroupedByCategory(): Promise<CategoryGroupDto[]> {
    const cars = await this.carModel.findAll({
      include: [
        { model: Category, as: 'category', required: true },
        { model: CarImage, as: 'images' },
        { model: Tag, as: 'tags' },
      ],
      order: [['createdAt', 'DESC']],
    });

    const byCategory = new Map<
      number,
      { category: CategoryResponseDto; cars: CarResponseDto[] }
    >();

    for (const car of cars) {
      if (!car.category) continue;
      const categoryDto: CategoryResponseDto = {
        id: car.category.id,
        name: car.category.name,
        createdAt: car.category.createdAt,
        updatedAt: car.category.updatedAt,
      };
      if (!byCategory.has(car.categoryId)) {
        byCategory.set(car.categoryId, {
          category: categoryDto,
          cars: [],
        });
      }
      byCategory.get(car.categoryId)!.cars.push(this.toResponse(car));
    }

    const groups = Array.from(byCategory.values()).map((g) => ({
      ...g,
      totalCount: g.cars.length,
    }));
    groups.sort((a, b) => a.category.name.localeCompare(b.category.name));
    return groups;
  }

  async getNearestCars(
    latitude: number,
    longitude: number,
    radiusKm = 10,
  ): Promise<NearestCarResponseDto[]> {
    const safeLatitude = Number(latitude);
    const safeLongitude = Number(longitude);
    const safeRadiusKm = Number(radiusKm);
    if (
      !Number.isFinite(safeLatitude) ||
      !Number.isFinite(safeLongitude) ||
      !Number.isFinite(safeRadiusKm) ||
      safeRadiusKm <= 0
    ) {
      throw new BadRequestException('Invalid coordinates or radius');
    }

    const { minLatitude, maxLatitude, minLongitude, maxLongitude } =
      this.getBoundingBox(safeLatitude, safeLongitude, safeRadiusKm);
    const radiusMeters = Math.round(safeRadiusKm * 1000);
    const distanceExpr = `ST_Distance_Sphere(POINT(\`Car\`.\`longitude\`, \`Car\`.\`latitude\`), POINT(${safeLongitude}, ${safeLatitude}))`;

    const cars = await this.carModel.findAll({
      attributes: {
        include: [[literal(distanceExpr), 'distanceMeters']],
      },
      where: {
        [Op.and]: [
          { latitude: { [Op.between]: [minLatitude, maxLatitude] } },
          { longitude: { [Op.between]: [minLongitude, maxLongitude] } },
          literal(`${distanceExpr} <= ${radiusMeters}`),
        ],
      } as WhereOptions<Car>,
      include: [
        { model: Category, as: 'category' },
        { model: CarImage, as: 'images' },
        { model: Tag, as: 'tags' },
      ],
      order: [[literal(distanceExpr), 'ASC']],
    });

    return cars.map((car) => {
      const distanceMeters = Number(car.get('distanceMeters'));
      return {
        ...this.toResponse(car),
        distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
      };
    });
  }

  private getBoundingBox(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ) {
    const latitudeDelta = radiusKm / 111.32;
    const longitudeDivisor = 111.32 * Math.cos((latitude * Math.PI) / 180);
    const safeLongitudeDivisor =
      Math.abs(longitudeDivisor) < 1e-6 ? 1e-6 : longitudeDivisor;
    const longitudeDelta = radiusKm / Math.abs(safeLongitudeDivisor);
    return {
      minLatitude: latitude - latitudeDelta,
      maxLatitude: latitude + latitudeDelta,
      minLongitude: longitude - longitudeDelta,
      maxLongitude: longitude + longitudeDelta,
    };
  }

  async findOne(id: number): Promise<CarResponseDto> {
    const car = await this.carModel.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: CarImage, as: 'images' },
        { model: Tag, as: 'tags' },
      ],
    });
    if (!car) {
      throw new NotFoundException('Car not found');
    }
    return this.toResponse(car);
  }

  async update(id: number, dto: UpdateCarDto): Promise<CarResponseDto> {
    return this.carModel.sequelize!.transaction(async (transaction) => {
      const car = await this.carModel.findByPk(id, { transaction });
      if (!car) {
        throw new NotFoundException('Car not found');
      }
      await this.validateUpdate(dto, transaction);
      await this.applyUpdate(car, dto, transaction);
      return this.findOne(car.id);
    });
  }

  private async validateUpdate(
    dto: UpdateCarDto,
    transaction: Transaction,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      const category = await this.categoryModel.findByPk(dto.categoryId, {
        transaction,
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    if (dto.tagIds !== undefined) {
      const tagIds = [...new Set(dto.tagIds)];
      if (tagIds.length > 0) {
        const tags = await this.tagModel.findAll({
          where: { id: tagIds },
          transaction,
        });
        if (tags.length !== tagIds.length) {
          throw new BadRequestException('One or more tags not found');
        }
      }
    }
  }

  private async applyUpdate(
    car: Car,
    dto: UpdateCarDto,
    transaction: Transaction,
  ): Promise<void> {
    if (dto.make !== undefined) car.make = dto.make.trim();
    if (dto.model !== undefined) car.model = dto.model.trim();
    if (dto.year !== undefined) car.year = dto.year;
    if (dto.color !== undefined) car.color = dto.color.trim();
    if (dto.price !== undefined) car.price = dto.price;
    if (dto.mileage !== undefined) car.mileage = dto.mileage;
    if (dto.description !== undefined) car.description = dto.description.trim();
    if (dto.categoryId !== undefined) car.categoryId = dto.categoryId;
    if (dto.latitude !== undefined) car.latitude = dto.latitude;
    if (dto.longitude !== undefined) car.longitude = dto.longitude;

    await car.save({ transaction });

    if (dto.imageUrls !== undefined) {
      await this.carImageModel.destroy({
        where: { carId: car.id },
        transaction,
      });
      if (dto.imageUrls.length > 0) {
        await this.carImageModel.bulkCreate(
          dto.imageUrls.map((url) => ({
            carId: car.id,
            url: url.trim(),
          })),
          { transaction },
        );
      }
    }

    if (dto.tagIds !== undefined) {
      const tagIds = [...new Set(dto.tagIds)];
      await car.$set('tags', tagIds, { transaction });
    }
  }

  async remove(id: number): Promise<void> {
    const car = await this.carModel.findByPk(id);
    if (!car) {
      throw new NotFoundException('Car not found');
    }
    await car.destroy();
  }

  private toResponse(car: Car): CarResponseDto {
    const category = car.get('category') as Category | undefined;
    const images = car.get('images') as CarImage[] | undefined;
    const tags = car.get('tags') as Tag[] | undefined;
    return {
      id: car.get('id'),
      make: car.get('make'),
      model: car.get('model'),
      year: car.get('year'),
      color: car.get('color'),
      price: Number(car.get('price')),
      mileage: car.get('mileage'),
      description: (car.get('description') as string | null) ?? undefined,
      categoryId: car.get('categoryId'),
      category: category
        ? {
            id: category.get('id'),
            name: category.get('name'),
            createdAt: category.get('createdAt'),
            updatedAt: category.get('updatedAt'),
          }
        : undefined,
      latitude: Number(car.get('latitude')),
      longitude: Number(car.get('longitude')),
      images: images?.map((img) => ({
        id: img.get('id'),
        url: img.get('url'),
        createdAt: img.get('createdAt'),
        updatedAt: img.get('updatedAt'),
      })),
      tags: tags?.map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        createdAt: tag.get('createdAt'),
        updatedAt: tag.get('updatedAt'),
      })),
      createdAt: car.get('createdAt'),
      updatedAt: car.get('updatedAt'),
    };
  }
}
