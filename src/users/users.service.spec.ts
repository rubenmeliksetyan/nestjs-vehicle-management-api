import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../common/enums/role.enum';
import { User } from '../database/models/user.model';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    findAll: jest.Mock;
    findByPk: jest.Mock;
  };

  const mockUser = {
    id: 1,
    email: 'user@test.com',
    fullName: 'Test User',
    passwordHash: 'hash',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    userModel = {
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findAll', () => {
    it('returns users ordered by id', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'other@test.com' }];
      userModel.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(userModel.findAll).toHaveBeenCalledWith({
        order: [['id', 'ASC']],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        email: 'user@test.com',
        fullName: 'Test User',
        role: Role.USER,
        isActive: true,
      });
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('returns empty array when no users', async () => {
      userModel.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('updates user isActive and returns response', async () => {
      const user = { ...mockUser, isActive: true };
      userModel.findByPk.mockResolvedValue(user);

      const result = await service.updateStatus(1, { isActive: false });

      expect(userModel.findByPk).toHaveBeenCalledWith(1);
      expect(user.isActive).toBe(false);
      expect(user.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 1, isActive: false });
    });

    it('enables user when isActive true', async () => {
      const user = { ...mockUser, isActive: false };
      userModel.findByPk.mockResolvedValue(user);

      const result = await service.updateStatus(1, { isActive: true });

      expect(user.isActive).toBe(true);
      expect(result.isActive).toBe(true);
    });

    it('throws NotFoundException when user not found', async () => {
      userModel.findByPk.mockResolvedValue(null);

      await expect(
        service.updateStatus(999, { isActive: false }),
      ).rejects.toThrow(NotFoundException);
      expect(userModel.findByPk).toHaveBeenCalledWith(999);
    });
  });
});
