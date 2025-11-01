import { Controller, Post, Body, Get, Param, ParseIntPipe, Put, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto } from '../dto/question.dto';
import { Question } from '../entity/question.entity';

@ApiTags('questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createQuestionDto: CreateQuestionDto): Promise<Question> {
    return await this.questionService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'Return all questions.' })
  async findAll(
    @Query('courseId') courseId?: string,
    @Query('groupId') groupId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('subChapterId') subChapterId?: string
  ): Promise<any[]> {
    // Convert string parameters to numbers
    const courseIdNum = courseId ? parseInt(courseId, 10) : undefined;
    const groupIdNum = groupId ? parseInt(groupId, 10) : undefined;
    const subjectIdNum = subjectId ? parseInt(subjectId, 10) : undefined;
    const chapterIdNum = chapterId ? parseInt(chapterId, 10) : undefined;
    const subChapterIdNum = subChapterId ? parseInt(subChapterId, 10) : undefined;

    // If any filter is provided, use filtered search
    if (courseIdNum || groupIdNum || subjectIdNum || chapterIdNum || subChapterIdNum) {
      return await this.questionService.findFilteredQuestions(
        courseIdNum,
        groupIdNum,
        subjectIdNum,
        chapterIdNum,
        subChapterIdNum
      );
    }
    
    // Otherwise return all questions
    return await this.questionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiResponse({ status: 200, description: 'Return the question.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const question = await this.questionService.findOne(id);
    if (!question) {
      throw new Error('Question not found');
    }
    return question;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a question by ID' })
  @ApiResponse({ status: 200, description: 'Question successfully updated.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<any> {
    const question = await this.questionService.update(id, updateQuestionDto);
    if (!question) {
      throw new Error('Question not found');
    }
    return question;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question by ID' })
  @ApiResponse({ status: 204, description: 'Question successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await this.questionService.remove(id);
    if (!result) {
      throw new Error('Question not found');
    }
  }
}