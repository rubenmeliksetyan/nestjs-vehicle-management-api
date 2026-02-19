import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { User } from '../database/models/user.model';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest
    .fn<Promise<boolean>, [string, string]>()
    .mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userModel: { findOne: jest.Mock; create: jest.Mock };
  let mailService: { sendWelcome: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 1,
    email: 'user@test.com',
    fullName: 'Test User',
    passwordHash: 'hashed',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue(mockUser),
    };
    mailService = { sendWelcome: jest.fn().mockResolvedValue(undefined) };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User),
          useValue: userModel,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'jwt.accessExpiresIn' ? '3600s' : undefined,
            ),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('creates user with hashed password and role USER', async () => {
      userModel.findOne.mockResolvedValue(null);

      await service.signup({
        email: 'new@test.com',
        fullName: 'New User',
        password: 'password123',
      });

      expect(jest.mocked(bcrypt.hash)).toHaveBeenCalledWith('password123', 10);
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@test.com',
          fullName: 'New User',
          passwordHash: 'hashed',
          role: Role.USER,
          isActive: true,
        }),
      );
    });

    it('calls mailService.sendWelcome', async () => {
      userModel.findOne.mockResolvedValue(null);

      await service.signup({
        email: 'new@test.com',
        fullName: 'New User',
        password: 'password123',
      });

      expect(mailService.sendWelcome).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.fullName,
      );
    });

    it('throws ConflictException when email exists', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      await expect(
        service.signup({
          email: 'user@test.com',
          fullName: 'Test',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('returns response without passwordHash', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.signup({
        email: 'new@test.com',
        fullName: 'New User',
        password: 'password123',
      });

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('email', 'user@test.com');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('signin', () => {
    it('returns accessToken when credentials valid', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.signin({
        email: 'user@test.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'token' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 1, email: 'user@test.com', role: Role.USER },
        expect.any(Object),
      );
    });

    it('throws UnauthorizedException when password invalid', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      (
        jest.mocked(bcrypt.compare) as unknown as jest.Mock<Promise<boolean>>
      ).mockResolvedValueOnce(false);

      await expect(
        service.signin({ email: 'user@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user disabled', async () => {
      userModel.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.signin({ email: 'user@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'unknown@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
