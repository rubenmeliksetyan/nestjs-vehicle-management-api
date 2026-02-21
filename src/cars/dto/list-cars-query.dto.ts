import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { CarOrderBy } from './find-all-cars-query.dto';

export class ListCarsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'id',
    'make',
    'model',
    'year',
    'color',
    'price',
    'mileage',
    'createdAt',
    'updatedAt',
  ])
  orderBy?: CarOrderBy = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    if (Array.isArray(value)) return value.map((v) => Number(v));
    const str = String(value);
    const numbers = str
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return numbers.length > 0 ? numbers : undefined;
  })
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
