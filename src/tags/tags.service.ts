import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tag } from '../database/models/tag.model';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag)
    private readonly tagModel: typeof Tag,
  ) {}

  async create(dto: CreateTagDto): Promise<TagResponseDto> {
    const existing = await this.tagModel.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }
    const tag = await this.tagModel.create({
      name: dto.name.trim(),
    });
    return this.toResponse(tag);
  }

  async findAll(): Promise<TagResponseDto[]> {
    const list = await this.tagModel.findAll({
      order: [['name', 'ASC']],
    });
    return list.map((t) => this.toResponse(t));
  }

  async findOne(id: number): Promise<TagResponseDto> {
    const tag = await this.tagModel.findByPk(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return this.toResponse(tag);
  }

  async update(id: number, dto: UpdateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagModel.findByPk(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    if (dto.name !== undefined) {
      const existing = await this.tagModel.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tag with this name already exists');
      }
      tag.name = dto.name.trim();
      await tag.save();
    }
    return this.toResponse(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.tagModel.findByPk(id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    await tag.destroy();
  }

  private toResponse(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }
}
