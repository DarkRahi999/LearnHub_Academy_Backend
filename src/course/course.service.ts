import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/course.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { User } from '../auth/entity/user.entity';
import { UserRole } from '../utils/enums';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto, user: User): Promise<any> {
    const course = this.courseRepository.create({
      ...createCourseDto,
      createdBy: user,
      isActive: true,
    });

    await this.courseRepository.getEntityManager().persistAndFlush(course);
    
    // Serialize course to match frontend expectations
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      highlight: course.highlight,
      imageUrl: course.imageUrl,
      isActive: course.isActive,
      createdAt: course.createdAt.toISOString(),
      editedAt: course.editedAt ? course.editedAt.toISOString() : undefined,
      createdBy: {
        id: course.createdBy.id,
        firstName: course.createdBy.firstName || '',
        lastName: course.createdBy.lastName || ''
      }
    };
  }

  async getAllCourses(search?: string, page: number = 1, limit: number = 10): Promise<{ courses: any[], total: number, page: number, totalPages: number }> {
    try {
      // Using repository find method instead of query builder
      const where: any = { isActive: true };
      
      if (search) {
        where.$or = [
          { title: { $ilike: `%${search}%` } },
          { description: { $ilike: `%${search}%` } },
          { highlight: { $ilike: `%${search}%` } },
        ];
      }

      const [courses, total] = await this.courseRepository.findAndCount(where, { 
        orderBy: { createdAt: 'DESC' },
        limit,
        offset: (page - 1) * limit,
        populate: ['createdBy'] // Populate the createdBy field
      });

      // Serialize courses to match frontend expectations
      const serializedCourses = courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        highlight: course.highlight,
        imageUrl: course.imageUrl,
        isActive: course.isActive,
        createdAt: course.createdAt.toISOString(),
        editedAt: course.editedAt ? course.editedAt.toISOString() : undefined,
        createdBy: {
          id: course.createdBy.id,
          firstName: course.createdBy.firstName || '',
          lastName: course.createdBy.lastName || ''
        }
      }));

      return {
        courses: serializedCourses,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 0 // Ensure totalPages is 0 if total is 0
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getCourseById(id: number): Promise<any> {
    const course = await this.courseRepository.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // Serialize course to match frontend expectations
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      highlight: course.highlight,
      imageUrl: course.imageUrl,
      isActive: course.isActive,
      createdAt: course.createdAt.toISOString(),
      editedAt: course.editedAt ? course.editedAt.toISOString() : undefined,
      createdBy: {
        id: course.createdBy.id,
        firstName: course.createdBy.firstName || '',
        lastName: course.createdBy.lastName || ''
      }
    };
  }

  async updateCourse(id: number, updateCourseDto: UpdateCourseDto, user: User): Promise<any> {
    const course = await this.courseRepository.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // Check if user is the creator or has admin rights
    if (course.createdBy.id !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this course');
    }

    this.courseRepository.assign(course, updateCourseDto);
    await this.courseRepository.getEntityManager().flush();
    
    // Serialize course to match frontend expectations
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      highlight: course.highlight,
      imageUrl: course.imageUrl,
      isActive: course.isActive,
      createdAt: course.createdAt.toISOString(),
      editedAt: course.editedAt ? course.editedAt.toISOString() : undefined,
      createdBy: {
        id: course.createdBy.id,
        firstName: course.createdBy.firstName || '',
        lastName: course.createdBy.lastName || ''
      }
    };
  }

  async deleteCourse(id: number, user: User): Promise<void> {
    const course = await this.courseRepository.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    // Check if user is the creator or has admin rights
    if (course.createdBy.id !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this course');
    }

    course.isActive = false;
    await this.courseRepository.getEntityManager().flush();
  }
}