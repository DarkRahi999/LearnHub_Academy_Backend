import { Controller, Post, Body, Get, Param, ParseIntPipe, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, SubjectRes, UpdateSubjectDto } from '../dto/subject.dto';
import { Subject } from '../entity/subject.entity';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({ status: 201, description: 'Subject successfully created.', type: SubjectRes })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
    return await this.subjectService.create(createSubjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiResponse({ status: 200, description: 'Return all subjects.', type: [SubjectRes] })
  async findAll(): Promise<Subject[]> {
    return await this.subjectService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiResponse({ status: 200, description: 'Return the subject.', type: SubjectRes })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Subject> {
    const subject = await this.subjectService.findOne(id);
    if (!subject) {
      throw new Error('Subject not found');
    }
    return subject;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subject by ID' })
  @ApiResponse({ status: 200, description: 'Subject successfully updated.', type: SubjectRes })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ): Promise<Subject> {
    const subject = await this.subjectService.update(id, updateSubjectDto);
    if (!subject) {
      throw new Error('Subject not found');
    }
    return subject;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject by ID' })
  @ApiResponse({ status: 204, description: 'Subject successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Subject not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await this.subjectService.remove(id);
    if (!result) {
      throw new Error('Subject not found');
    }
  }
}