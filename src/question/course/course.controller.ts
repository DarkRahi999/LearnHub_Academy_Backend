import { Controller, Post, Body, Get, Param, ParseIntPipe, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CourseRes, CreateCourseDto, UpdateCourseDto } from '../dto/course.dto';
import { ExamCourse } from '../entity/course.entity';

@ApiTags('ExamCourses')
@Controller('examCourses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course successfully created.', type: CourseRes })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createCourseDto: CreateCourseDto): Promise<ExamCourse> {
    return await this.courseService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Return all courses.', type: [CourseRes] })
  async findAll(): Promise<ExamCourse[]> {
    return await this.courseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({ status: 200, description: 'Return the course.', type: CourseRes })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamCourse> {
    const course = await this.courseService.findOne(id);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a course by ID' })
  @ApiResponse({ status: 200, description: 'Course successfully updated.', type: CourseRes })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<ExamCourse> {
    const course = await this.courseService.update(id, updateCourseDto);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course by ID' })
  @ApiResponse({ status: 204, description: 'Course successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await this.courseService.remove(id);
    if (!result) {
      throw new Error('Course not found');
    }
  }
}