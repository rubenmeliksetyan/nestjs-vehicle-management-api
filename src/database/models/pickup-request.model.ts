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
import { User } from './user.model';
import { Car } from './car.model';
import { PickupRequestStatus } from '../../common/enums/pickup-request-status.enum';

@Table({
  tableName: 'pickup_requests',
  underscored: true,
  timestamps: true,
})
export class PickupRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Car)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'car_id',
  })
  declare carId: number;

  @BelongsTo(() => Car)
  declare car: Car;

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

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: PickupRequestStatus.PENDING,
  })
  declare status: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
