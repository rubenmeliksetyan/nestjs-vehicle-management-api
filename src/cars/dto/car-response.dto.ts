import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class CarImageResponseDto {
  id!: number;
  url!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class CarResponseDto {
  id!: number;
  make!: string;
  model!: string;
  year!: number;
  color!: string;
  price!: number;
  mileage!: number;
  description?: string;
  categoryId!: number;
  category?: CategoryResponseDto;
  latitude!: number;
  longitude!: number;
  images?: CarImageResponseDto[];
  tags?: TagResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
