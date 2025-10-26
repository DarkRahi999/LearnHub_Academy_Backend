import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SubChapter } from '../entity/subchapter.entity';
import { CreateSubChapterDto, UpdateSubChapterDto } from '../dto/subchapter.dto';
import { Chapter } from '../entity/chapter.entity';

@Injectable()
export class SubChapterService {
  constructor(private readonly em: EntityManager) {}

  async create(createSubChapterDto: CreateSubChapterDto): Promise<SubChapter> {
    const chapter = await this.em.findOne(Chapter, { id: createSubChapterDto.chapterId }, { 
      populate: ['course', 'group', 'subject'] 
    });
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // Validate that the provided IDs match the chapter's relationships
    if (createSubChapterDto.courseId && createSubChapterDto.courseId !== chapter.course.id) {
      throw new Error('Course ID does not match the chapter\'s course');
    }

    if (createSubChapterDto.groupId && createSubChapterDto.groupId !== chapter.group.id) {
      throw new Error('Group ID does not match the chapter\'s group');
    }

    if (createSubChapterDto.subjectId && createSubChapterDto.subjectId !== chapter.subject.id) {
      throw new Error('Subject ID does not match the chapter\'s subject');
    }

    const subChapter = this.em.create(SubChapter, {
      name: createSubChapterDto.name,
      chapter: chapter,
      course: chapter.course,
      group: chapter.group,
      subject: chapter.subject,
      description: createSubChapterDto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(subChapter);
    return subChapter;
  }

  async findAll(): Promise<any[]> {
    const subChapters = await this.em.find(SubChapter, {}, { populate: ['chapter', 'course', 'group', 'subject'] });
    // Transform subChapters to ensure they have chapterId, courseId, groupId, and subjectId properties
    return subChapters.map(subChapter => ({
      id: subChapter.id,
      name: subChapter.name,
      description: subChapter.description,
      chapterId: subChapter.chapter.id,
      courseId: subChapter.course.id,
      groupId: subChapter.group.id,
      subjectId: subChapter.subject.id,
      createdAt: subChapter.createdAt,
      updatedAt: subChapter.updatedAt
    }));
  }

  async findOne(id: number): Promise<any | null> {
    const subChapter = await this.em.findOne(SubChapter, { id }, { populate: ['chapter', 'course', 'group', 'subject'] });
    if (subChapter) {
      // Transform subChapter to ensure it has chapterId, courseId, groupId, and subjectId properties
      return {
        id: subChapter.id,
        name: subChapter.name,
        description: subChapter.description,
        chapterId: subChapter.chapter.id,
        courseId: subChapter.course.id,
        groupId: subChapter.group.id,
        subjectId: subChapter.subject.id,
        createdAt: subChapter.createdAt,
        updatedAt: subChapter.updatedAt
      };
    }
    return null;
  }

  async update(id: number, updateSubChapterDto: UpdateSubChapterDto): Promise<any | null> {
    const subChapter = await this.em.findOne(SubChapter, { id }, { 
      populate: ['chapter', 'course', 'group', 'subject'] 
    });
    if (!subChapter) {
      return null;
    }

    if (updateSubChapterDto.chapterId) {
      const chapter = await this.em.findOne(Chapter, { id: updateSubChapterDto.chapterId }, { 
        populate: ['course', 'group', 'subject'] 
      });
      if (!chapter) {
        throw new Error('Chapter not found');
      }
      
      // Validate that the provided IDs match the chapter's relationships
      if (updateSubChapterDto.courseId && updateSubChapterDto.courseId !== chapter.course.id) {
        throw new Error('Course ID does not match the chapter\'s course');
      }

      if (updateSubChapterDto.groupId && updateSubChapterDto.groupId !== chapter.group.id) {
        throw new Error('Group ID does not match the chapter\'s group');
      }

      if (updateSubChapterDto.subjectId && updateSubChapterDto.subjectId !== chapter.subject.id) {
        throw new Error('Subject ID does not match the chapter\'s subject');
      }
      
      subChapter.chapter = chapter;
      subChapter.course = chapter.course;
      subChapter.group = chapter.group;
      subChapter.subject = chapter.subject;
    } else {
      // If chapterId is not being updated, check if other IDs are provided and validate them
      if (updateSubChapterDto.courseId && updateSubChapterDto.courseId !== subChapter.course.id) {
        throw new Error('Course ID does not match the current chapter\'s course');
      }

      if (updateSubChapterDto.groupId && updateSubChapterDto.groupId !== subChapter.group.id) {
        throw new Error('Group ID does not match the current chapter\'s group');
      }

      if (updateSubChapterDto.subjectId && updateSubChapterDto.subjectId !== subChapter.subject.id) {
        throw new Error('Subject ID does not match the current chapter\'s subject');
      }
    }

    this.em.assign(subChapter, updateSubChapterDto);
    subChapter.updatedAt = new Date();
    await this.em.flush();
    
    // Transform subChapter to ensure it has chapterId, courseId, groupId, and subjectId properties
    return {
      id: subChapter.id,
      name: subChapter.name,
      description: subChapter.description,
      chapterId: subChapter.chapter.id,
      courseId: subChapter.course.id,
      groupId: subChapter.group.id,
      subjectId: subChapter.subject.id,
      createdAt: subChapter.createdAt,
      updatedAt: subChapter.updatedAt
    };
  }

  async remove(id: number): Promise<boolean> {
    const subChapter = await this.em.findOne(SubChapter, { id });
    if (!subChapter) {
      return false;
    }

    await this.em.removeAndFlush(subChapter);
    return true;
  }
}