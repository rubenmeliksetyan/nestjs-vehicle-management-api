import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../database/models/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.categoryModel.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }
    const category = await this.categoryModel.create({
      name: dto.name.trim(),
    });
    return this.toResponse(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const list = await this.categoryModel.findAll({
      order: [['name', 'ASC']],
    });
    return list.map((c) => this.toResponse(c));
  }

  async findOne(id: number): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.toResponse(category);
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (dto.name !== undefined) {
      const existing = await this.categoryModel.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
      category.name = dto.name.trim();
      await category.save();
    }
    return this.toResponse(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await category.destroy();
  }

  private toResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
