import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Chapter } from '../entity/chapter.entity';
import { Group } from '../entity/group.entity';
import { Subject } from '../entity/subject.entity';
import { CreateChapterDto, UpdateChapterDto } from '../dto/chapter.dto';
import { ExamCourse } from '../entity/course.entity';

@Injectable()
export class ChapterService {
  constructor(private readonly em: EntityManager) {}

  async create(createChapterDto: CreateChapterDto): Promise<Chapter> {
    const course = await this.em.findOne(ExamCourse, { id: createChapterDto.courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    const group = await this.em.findOne(Group, { id: createChapterDto.groupId });
    if (!group) {
      throw new Error('Group not found');
    }

    const subject = await this.em.findOne(Subject, { id: createChapterDto.subjectId });
    if (!subject) {
      throw new Error('Subject not found');
    }

    const chapter = this.em.create(Chapter, {
      name: createChapterDto.name,
      course: course,
      group: group,
      subject: subject,
      description: createChapterDto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(chapter);
    return chapter;
  }

  async findAll(): Promise<any[]> {
    const chapters = await this.em.find(Chapter, {}, { populate: ['course', 'group', 'subject'] });
    // Transform chapters to ensure they have courseId, groupId, and subjectId properties
    return chapters.map(chapter => ({
      id: chapter.id,
      name: chapter.name,
      description: chapter.description,
      courseId: chapter.course.id,
      groupId: chapter.group.id,
      subjectId: chapter.subject.id,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt
    }));
  }

  async findOne(id: number): Promise<any | null> {
    const chapter = await this.em.findOne(Chapter, { id }, { populate: ['course', 'group', 'subject'] });
    if (chapter) {
      // Transform chapter to ensure it has courseId, groupId, and subjectId properties
      return {
        id: chapter.id,
        name: chapter.name,
        description: chapter.description,
        courseId: chapter.course.id,
        groupId: chapter.group.id,
        subjectId: chapter.subject.id,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt
      };
    }
    return null;
  }

  async update(id: number, updateChapterDto: UpdateChapterDto): Promise<any | null> {
    const chapter = await this.em.findOne(Chapter, { id });
    if (!chapter) {
      return null;
    }

    if (updateChapterDto.courseId) {
      const course = await this.em.findOne(ExamCourse, { id: updateChapterDto.courseId });
      if (!course) {
        throw new Error('Course not found');
      }
      chapter.course = course;
    }

    if (updateChapterDto.groupId) {
      const group = await this.em.findOne(Group, { id: updateChapterDto.groupId });
      if (!group) {
        throw new Error('Group not found');
      }
      chapter.group = group;
    }

    if (updateChapterDto.subjectId) {
      const subject = await this.em.findOne(Subject, { id: updateChapterDto.subjectId });
      if (!subject) {
        throw new Error('Subject not found');
      }
      chapter.subject = subject;
    }

    this.em.assign(chapter, updateChapterDto);
    chapter.updatedAt = new Date();
    await this.em.flush();
    
    // Transform chapter to ensure it has courseId, groupId, and subjectId properties
    return {
      id: chapter.id,
      name: chapter.name,
      description: chapter.description,
      courseId: chapter.course.id,
      groupId: chapter.group.id,
      subjectId: chapter.subject.id,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt
    };
  }

  async remove(id: number): Promise<boolean> {
    const chapter = await this.em.findOne(Chapter, { id });
    if (!chapter) {
      return false;
    }

    await this.em.removeAndFlush(chapter);
    return true;
  }
}