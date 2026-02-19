import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateCarDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  make?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  latitude?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
