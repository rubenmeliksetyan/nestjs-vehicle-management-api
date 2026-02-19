import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Category } from './category.model';
import { Tag } from './tag.model';
import { CarImage } from './car-image.model';
import { CarTag } from './car-tag.model';

@Table({
  tableName: 'cars',
  underscored: true,
  timestamps: true,
})
export class Car extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  make!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  model!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  color!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  mileage!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'category_id',
  })
  categoryId!: number;

  @BelongsTo(() => Category)
  category!: Category;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: false,
  })
  latitude!: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: false,
  })
  longitude!: number;

  @HasMany(() => CarImage)
  images!: CarImage[];

  @BelongsToMany(() => Tag, () => CarTag)
  tags!: Tag[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
