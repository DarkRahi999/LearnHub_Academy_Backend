import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Group } from '../entity/group.entity';
import { CreateGroupDto, UpdateGroupDto } from '../dto/group.dto';
import { ExamCourse } from '../entity/course.entity';

@Injectable()
export class GroupService {
  constructor(private readonly em: EntityManager) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const course = await this.em.findOne(ExamCourse, { id: createGroupDto.courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    const group = this.em.create(Group, {
      name: createGroupDto.name,
      course: course,
      description: createGroupDto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(group);
    return group;
  }

  async findAll(): Promise<any[]> {
    const groups = await this.em.find(Group, {}, { populate: ['course'] });
    // Transform groups to ensure they have courseId property
    return groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      courseId: group.course.id,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));
  }

  async findOne(id: number): Promise<any | null> {
    const group = await this.em.findOne(Group, { id }, { populate: ['course'] });
    if (group) {
      // Transform group to ensure it has courseId property
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        courseId: group.course.id,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };
    }
    return null;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<any | null> {
    const group = await this.em.findOne(Group, { id });
    if (!group) {
      return null;
    }

    if (updateGroupDto.courseId) {
      const course = await this.em.findOne(ExamCourse, { id: updateGroupDto.courseId });
      if (!course) {
        throw new Error('Course not found');
      }
      group.course = course;
    }

    this.em.assign(group, updateGroupDto);
    group.updatedAt = new Date();
    await this.em.flush();
    
    // Transform group to ensure it has courseId property
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      courseId: group.course.id,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  }

  async remove(id: number): Promise<boolean> {
    const group = await this.em.findOne(Group, { id });
    if (!group) {
      return false;
    }

    await this.em.removeAndFlush(group);
    return true;
  }
}