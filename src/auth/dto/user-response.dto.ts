import { Role } from '../../common/enums/role.enum';

export class UserResponseDto {
  id!: number;
  email!: string;
  fullName!: string;
  role!: Role;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
