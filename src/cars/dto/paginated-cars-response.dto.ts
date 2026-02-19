import { CarResponseDto } from './car-response.dto';

export class PaginatedCarsResponseDto {
  data!: CarResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
