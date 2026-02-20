import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePickupRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  carId!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
