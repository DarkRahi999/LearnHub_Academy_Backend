import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, ValidationPipe, ParseIntPipe, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/course.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, RequirePermissions } from '../auth/role.guard';
import { Permission } from '../utils/enums';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_COURSE)
  @ApiOperation({ summary: 'Create a new course (Admin/Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createCourse(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createCourseDto: CreateCourseDto, 
    @Req() req: any
  ) {
    return this.courseService.createCourse(createCourseDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active courses with optional search' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async getAllCourses(
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10
  ) {
    const logger = new Logger('CourseController');
    logger.log(`Fetching courses with search: ${search}, page: ${page}, limit: ${limit}`);
    
    // Ensure page and limit are numbers
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10)); // Limit max to 100 for performance
    
    logger.log(`Processed params - page: ${pageNum}, limit: ${limitNum}`);
    
    try {
      const result = await this.courseService.getAllCourses(search, pageNum, limitNum);
      logger.log(`Successfully fetched ${result.courses.length} courses`);
      return result;
    } catch (error) {
      logger.error('Error fetching courses:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number
  ) {
    return this.courseService.getCourseById(id);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_COURSE)
  @ApiOperation({ summary: 'Update a course (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async updateCourse(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateCourseDto: UpdateCourseDto,
    @Req() req: any
  ) {
    return this.courseService.updateCourse(id, updateCourseDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_COURSE)
  @ApiOperation({ summary: 'Soft delete a course (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Course soft deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async deleteCourse(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: any
  ) {
    return this.courseService.deleteCourse(id, req.user);
  }
}