import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/course.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { User } from '../auth/entity/user.entity';
import { Permission, UserRole } from '../utils/enums';
import { RolePermissionsService } from 'src/auth/role-permissions.service';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: EntityRepository<Course>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) { }

  async createCourse(createCourseDto: CreateCourseDto, userFromJwt: any) {
    const em = this.courseRepository.getEntityManager().fork();
    try {
      // Fetch the complete user from database using the JWT user info
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      // Check if user has permission to create courses (not notices)
      if (!this.rolePermissionsService.hasPermission(user.role, Permission.CREATE_COURSE)) {
        throw new ForbiddenException('You do not have permission to create courses');
      }

      // Validate input data (these validations are also handled by DTO validators)
      if (!createCourseDto.title || createCourseDto.title.trim().length < 5) {
        throw new BadRequestException('Title must be at least 5 characters long');
      }
      if (!createCourseDto.description || createCourseDto.description.trim().length < 10) {
        throw new BadRequestException('Description must be at least 10 characters long');
      }
      if (!createCourseDto.highlight || createCourseDto.highlight.trim().length < 5) {
        throw new BadRequestException('Highlight must be at least 5 characters long');
      }

      // Create the course entity with user reference
      const course = em.create(Course, {
        title: createCourseDto.title.trim(),
        description: createCourseDto.description.trim(),
        highlight: createCourseDto.highlight.trim(),
        imageUrl: createCourseDto.imageUrl?.trim(),
        price: createCourseDto.price,
        discountPrice: createCourseDto.discountPrice,
        isActive: true,
        createdAt: new Date(),
        createdBy: user // Reference the user entity directly
      });
      
      // Persist to database
      await em.persistAndFlush(course);

      // Reload with relations for response
      const savedCourse = await em.findOne(Course, { id: course.id }, { populate: ['createdBy'] });

      this.logger.log(`Course created successfully with ID: ${savedCourse!.id}`);
      return savedCourse;
    } catch (error) {
      this.logger.error(`Error creating course: ${error.message}`, error.stack);

      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle database specific errors
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('A course with similar content already exists');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Invalid user reference');
      }
      if (error.code === '23514') { // Check constraint violation
        throw new BadRequestException('Course data does not meet validation requirements');
      }

      throw new BadRequestException('Failed to create course. Please try again.');
    }
  }

  async getAllCourses(options: {
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    createdBy?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ courses: any[], total: number, page: number, totalPages: number }> {
    try {
      // Using repository find method instead of query builder
      const where: any = { isActive: true };

      // Apply search filter
      if (options.search) {
        where.$or = [
          { title: { $ilike: `%${options.search}%` } },
          { description: { $ilike: `%${options.search}%` } },
          { highlight: { $ilike: `%${options.search}%` } },
        ];
      }

      // Apply createdBy filter
      if (options.createdBy) {
        where.createdBy = options.createdBy;
      }

      // Apply date range filters
      if (options.dateFrom || options.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) {
          where.createdAt.$gte = new Date(options.dateFrom);
        }
        if (options.dateTo) {
          where.createdAt.$lte = new Date(options.dateTo);
        }
      }

      // Set default sort options
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'DESC';

      const [courses, total] = await this.courseRepository.findAndCount(where, {
        orderBy: { [sortBy]: sortOrder },
        limit: options.limit,
        offset: (options.page - 1) * options.limit,
        populate: ['createdBy'] // Populate the createdBy field
      });

      // Serialize courses to match frontend expectations
      const serializedCourses = courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        highlight: course.highlight,
        imageUrl: course.imageUrl,
        price: course.price,
        discountPrice: course.discountPrice,
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
        page: options.page,
        totalPages: Math.ceil(total / options.limit) || 0 // Ensure totalPages is 0 if total is 0
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
      price: course.price,
      discountPrice: course.discountPrice,
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
      price: course.price,
      discountPrice: course.discountPrice,
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