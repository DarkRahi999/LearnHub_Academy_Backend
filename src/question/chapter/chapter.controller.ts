import { Controller, Post, Body, Get, Param, ParseIntPipe, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ChapterService } from './chapter.service';
import { ChapterRes, CreateChapterDto, UpdateChapterDto } from '../dto/chapter.dto';
import { Chapter } from '../entity/chapter.entity';
@ApiTags('chapters')
@Controller('chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiResponse({ status: 201, description: 'Chapter successfully created.', type: ChapterRes })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createChapterDto: CreateChapterDto): Promise<Chapter> {
    return await this.chapterService.create(createChapterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chapters' })
  @ApiResponse({ status: 200, description: 'Return all chapters.', type: [ChapterRes] })
  async findAll(): Promise<Chapter[]> {
    return await this.chapterService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chapter by ID' })
  @ApiResponse({ status: 200, description: 'Return the chapter.', type: ChapterRes })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Chapter> {
    const chapter = await this.chapterService.findOne(id);
    if (!chapter) {
      throw new Error('Chapter not found');
    }
    return chapter;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a chapter by ID' })
  @ApiResponse({ status: 200, description: 'Chapter successfully updated.', type: ChapterRes })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChapterDto: UpdateChapterDto,
  ): Promise<Chapter> {
    const chapter = await this.chapterService.update(id, updateChapterDto);
    if (!chapter) {
      throw new Error('Chapter not found');
    }
    return chapter;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chapter by ID' })
  @ApiResponse({ status: 204, description: 'Chapter successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await this.chapterService.remove(id);
    if (!result) {
      throw new Error('Chapter not found');
    }
  }
}