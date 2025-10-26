import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateCourseDto, UpdateCourseDto } from '../dto/course.dto';
import { ExamCourse } from '../entity/course.entity';

@Injectable()
export class CourseService {
  constructor(private readonly em: EntityManager) {}

  async create(createCourseDto: CreateCourseDto): Promise<ExamCourse> {
    const course = this.em.create(ExamCourse, {
      name: createCourseDto.name,
      description: createCourseDto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(course);
    return course;
  }

  async findAll(): Promise<ExamCourse[]> {
    return await this.em.find(ExamCourse, {});
  }

  async findOne(id: number): Promise<ExamCourse | null> {
    return await this.em.findOne(ExamCourse, { id });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<ExamCourse | null> {
    const course = await this.em.findOne(ExamCourse, { id });
    if (!course) {
      return null;
    }

    this.em.assign(course, updateCourseDto);
    course.updatedAt = new Date();
    await this.em.flush();
    return course;
  }

  async remove(id: number): Promise<boolean> {
    const course = await this.em.findOne(ExamCourse, { id });
    if (!course) {
      return false;
    }

    await this.em.removeAndFlush(ExamCourse);
    return true;
  }
}