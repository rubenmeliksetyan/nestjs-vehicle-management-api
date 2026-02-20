import { IsIn } from 'class-validator';

export type CarOrderBy =
  | 'id'
  | 'make'
  | 'model'
  | 'year'
  | 'color'
  | 'price'
  | 'mileage'
  | 'createdAt'
  | 'updatedAt';

export class FindAllCarsQueryDto {
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
  orderBy: CarOrderBy = 'createdAt';

  @IsIn(['ASC', 'DESC'])
  orderDirection: 'ASC' | 'DESC' = 'DESC';
}
