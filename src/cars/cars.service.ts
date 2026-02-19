import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Car } from '../database/models/car.model';
import { CarImage } from '../database/models/car-image.model';
import { Category } from '../database/models/category.model';
import { Tag } from '../database/models/tag.model';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarResponseDto } from './dto/car-response.dto';
import { CategoryResponseDto } from '../categories/dto/category-response.dto';

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
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(): Promise<CarResponseDto[]> {
    const cars = await this.carModel.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: CarImage, as: 'images' },
        { model: Tag, as: 'tags' },
      ],
      order: [['createdAt', 'DESC']],
    });
    return cars.map((car) => this.toResponse(car));
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
    const car = await this.carModel.findByPk(id);
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoryModel.findByPk(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (dto.tagIds !== undefined) {
      if (dto.tagIds.length > 0) {
        const tags = await this.tagModel.findAll({
          where: { id: dto.tagIds },
        });
        if (tags.length !== dto.tagIds.length) {
          throw new BadRequestException('One or more tags not found');
        }
      }
    }

    const transaction = await this.carModel.sequelize!.transaction();

    try {
      if (dto.make !== undefined) car.make = dto.make.trim();
      if (dto.model !== undefined) car.model = dto.model.trim();
      if (dto.year !== undefined) car.year = dto.year;
      if (dto.color !== undefined) car.color = dto.color.trim();
      if (dto.price !== undefined) car.price = dto.price;
      if (dto.mileage !== undefined) car.mileage = dto.mileage;
      if (dto.description !== undefined)
        car.description = dto.description.trim();
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
        await car.$set('tags', dto.tagIds, { transaction });
      }

      await transaction.commit();

      return this.findOne(car.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
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
    return {
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      color: car.color,
      price: Number(car.price),
      mileage: car.mileage,
      description: car.description,
      categoryId: car.categoryId,
      category: car.category
        ? ({
            id: car.category.id,
            name: car.category.name,
            createdAt: car.category.createdAt,
            updatedAt: car.category.updatedAt,
          } as CategoryResponseDto)
        : undefined,
      latitude: Number(car.latitude),
      longitude: Number(car.longitude),
      images: car.images
        ? car.images.map((img) => ({
            id: img.id,
            url: img.url,
            createdAt: img.createdAt,
            updatedAt: img.updatedAt,
          }))
        : undefined,
      tags: car.tags
        ? car.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
          }))
        : undefined,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    };
  }
}
