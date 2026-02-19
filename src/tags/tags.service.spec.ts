import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Tag } from '../database/models/tag.model';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  let service: TagsService;
  let tagModel: {
    findOne: jest.Mock;
    findAll: jest.Mock;
    findByPk: jest.Mock;
    create: jest.Mock;
  };

  const mockTag = {
    id: 1,
    name: 'Eco',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    tagModel = {
      findOne: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn(),
      create: jest.fn().mockResolvedValue(mockTag),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getModelToken(Tag),
          useValue: tagModel,
        },
      ],
    }).compile();

    service = module.get(TagsService);
  });

  describe('create', () => {
    it('creates tag with trimmed name', async () => {
      tagModel.findOne.mockResolvedValue(null);

      await service.create({ name: '  Sport  ' });

      expect(tagModel.create).toHaveBeenCalledWith({ name: 'Sport' });
    });

    it('throws ConflictException when name exists', async () => {
      tagModel.findOne.mockResolvedValue(mockTag);

      await expect(service.create({ name: 'Eco' })).rejects.toThrow(
        ConflictException,
      );
      expect(tagModel.create).not.toHaveBeenCalled();
    });

    it('returns tag response', async () => {
      tagModel.findOne.mockResolvedValue(null);

      const result = await service.create({ name: 'Eco' });

      expect(result).toMatchObject({ id: 1, name: 'Eco' });
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('findAll', () => {
    it('returns list ordered by name', async () => {
      const list = [{ ...mockTag }, { ...mockTag, id: 2, name: 'Sport' }];
      tagModel.findAll.mockResolvedValue(list);

      const result = await service.findAll();

      expect(tagModel.findAll).toHaveBeenCalledWith({
        order: [['name', 'ASC']],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, name: 'Eco' });
    });
  });

  describe('findOne', () => {
    it('returns tag when found', async () => {
      tagModel.findByPk.mockResolvedValue(mockTag);

      const result = await service.findOne(1);

      expect(result).toMatchObject({ id: 1, name: 'Eco' });
    });

    it('throws NotFoundException when not found', async () => {
      tagModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates name when provided', async () => {
      const tag = { ...mockTag, name: 'Eco' };
      tagModel.findByPk.mockResolvedValue(tag);
      tagModel.findOne.mockResolvedValue(null);

      const result = await service.update(1, { name: 'Eco-Friendly' });

      expect(tag.name).toBe('Eco-Friendly');
      expect(tag.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 1, name: 'Eco-Friendly' });
    });

    it('throws NotFoundException when tag not found', async () => {
      tagModel.findByPk.mockResolvedValue(null);

      await expect(service.update(999, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when new name taken by another', async () => {
      const tag = { ...mockTag };
      tagModel.findByPk.mockResolvedValue(tag);
      tagModel.findOne.mockResolvedValue({
        id: 2,
        name: 'Sport',
      });

      await expect(service.update(1, { name: 'Sport' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('destroys tag when found', async () => {
      tagModel.findByPk.mockResolvedValue(mockTag);

      await service.remove(1);

      expect(mockTag.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      tagModel.findByPk.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
