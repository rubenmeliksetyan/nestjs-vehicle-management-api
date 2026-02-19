import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Category } from '../database/models/category.model';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryModel: {
    findOne: jest.Mock;
    findAll: jest.Mock;
    findByPk: jest.Mock;
    create: jest.Mock;
  };

  const mockCategory = {
    id: 1,
    name: 'Sedan',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    categoryModel = {
      findOne: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn(),
      create: jest.fn().mockResolvedValue(mockCategory),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category),
          useValue: categoryModel,
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  describe('create', () => {
    it('creates category with trimmed name', async () => {
      categoryModel.findOne.mockResolvedValue(null);

      await service.create({ name: '  SUV  ' });

      expect(categoryModel.create).toHaveBeenCalledWith({ name: 'SUV' });
    });

    it('throws ConflictException when name exists', async () => {
      categoryModel.findOne.mockResolvedValue(mockCategory);

      await expect(service.create({ name: 'Sedan' })).rejects.toThrow(
        ConflictException,
      );
      expect(categoryModel.create).not.toHaveBeenCalled();
    });

    it('returns category response', async () => {
      categoryModel.findOne.mockResolvedValue(null);

      const result = await service.create({ name: 'Sedan' });

      expect(result).toMatchObject({ id: 1, name: 'Sedan' });
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('findAll', () => {
    it('returns list ordered by name', async () => {
      const list = [
        { ...mockCategory },
        { ...mockCategory, id: 2, name: 'SUV' },
      ];
      categoryModel.findAll.mockResolvedValue(list);

      const result = await service.findAll();

      expect(categoryModel.findAll).toHaveBeenCalledWith({
        order: [['name', 'ASC']],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, name: 'Sedan' });
    });
  });

  describe('findOne', () => {
    it('returns category when found', async () => {
      categoryModel.findByPk.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toMatchObject({ id: 1, name: 'Sedan' });
    });

    it('throws NotFoundException when not found', async () => {
      categoryModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates name when provided', async () => {
      const category = { ...mockCategory, name: 'Sedan' };
      categoryModel.findByPk.mockResolvedValue(category);
      categoryModel.findOne.mockResolvedValue(null);

      const result = await service.update(1, { name: 'Sedan Plus' });

      expect(category.name).toBe('Sedan Plus');
      expect(category.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 1, name: 'Sedan Plus' });
    });

    it('throws NotFoundException when category not found', async () => {
      categoryModel.findByPk.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when new name taken by another', async () => {
      const category = { ...mockCategory };
      categoryModel.findByPk.mockResolvedValue(category);
      categoryModel.findOne.mockResolvedValue({
        id: 2,
        name: 'SUV',
      });

      await expect(service.update(1, { name: 'SUV' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('destroys category when found', async () => {
      categoryModel.findByPk.mockResolvedValue(mockCategory);

      await service.remove(1);

      expect(mockCategory.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      categoryModel.findByPk.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
