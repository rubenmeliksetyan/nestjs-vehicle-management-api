import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Car } from './car.model';

@Table({
  tableName: 'car_images',
  underscored: true,
  timestamps: true,
})
export class CarImage extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Car)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'car_id',
  })
  carId!: number;

  @BelongsTo(() => Car)
  car!: Car;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  url!: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
