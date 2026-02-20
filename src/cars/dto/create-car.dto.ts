import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  make!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  model!: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  color!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  mileage!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  latitude!: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  longitude!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  imageUrls!: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
