import { CarResponseDto } from './car-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class CategoryGroupDto {
  category!: CategoryResponseDto;
  cars!: CarResponseDto[];
}
