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
  declare make: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare model: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare color: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare mileage: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'category_id',
  })
  declare categoryId: number;

  @BelongsTo(() => Category)
  declare category: Category;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: false,
  })
  declare latitude: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: false,
  })
  declare longitude: number;

  @HasMany(() => CarImage)
  declare images: CarImage[];

  @BelongsToMany(() => Tag, () => CarTag)
  declare tags: Tag[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
