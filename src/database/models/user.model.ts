import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Role } from '../../common/enums/role.enum';

@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'full_name',
  })
  declare fullName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'password_hash',
  })
  declare passwordHash: string;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    allowNull: false,
    defaultValue: Role.USER,
  })
  declare role: Role;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  declare isActive: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
