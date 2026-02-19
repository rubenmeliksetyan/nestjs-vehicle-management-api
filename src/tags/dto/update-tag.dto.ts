import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
