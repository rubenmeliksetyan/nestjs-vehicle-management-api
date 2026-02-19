import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
} from 'sequelize-typescript';
import { Car } from './car.model';
import { Tag } from './tag.model';

@Table({
  tableName: 'car_tags',
  underscored: true,
  timestamps: true,
})
export class CarTag extends Model {
  @ForeignKey(() => Car)
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'car_id',
  })
  carId!: number;

  @BelongsTo(() => Car)
  car!: Car;

  @ForeignKey(() => Tag)
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'tag_id',
  })
  tagId!: number;

  @BelongsTo(() => Tag)
  tag!: Tag;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
