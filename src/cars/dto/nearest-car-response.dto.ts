import { CarResponseDto } from './car-response.dto';

export class NearestCarResponseDto extends CarResponseDto {
  distanceKm!: number;
}
