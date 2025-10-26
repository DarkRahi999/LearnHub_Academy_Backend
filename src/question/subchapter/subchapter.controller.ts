import { Controller, Post, Body, Get, Param, ParseIntPipe, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubChapterService } from './subchapter.service';
import { SubChapter } from '../entity/subchapter.entity';
import { CreateSubChapterDto, UpdateSubChapterDto } from '../dto/subchapter.dto';
@ApiTags('subchapters')
@Controller('subchapters')
export class SubChapterController {
  constructor(private readonly subChapterService: SubChapterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subchapter' })
  @ApiResponse({ status: 201, description: 'SubChapter successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createSubChapterDto: CreateSubChapterDto): Promise<SubChapter> {
    return await this.subChapterService.create(createSubChapterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subchapters' })
  @ApiResponse({ status: 200, description: 'Return all subchapters.' })
  async findAll(): Promise<SubChapter[]> {
    return await this.subChapterService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subchapter by ID' })
  @ApiResponse({ status: 200, description: 'Return the subchapter.' })
  @ApiResponse({ status: 404, description: 'SubChapter not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SubChapter> {
    const subChapter = await this.subChapterService.findOne(id);
    if (!subChapter) {
      throw new Error('SubChapter not found');
    }
    return subChapter;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subchapter by ID' })
  @ApiResponse({ status: 200, description: 'SubChapter successfully updated.' })
  @ApiResponse({ status: 404, description: 'SubChapter not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubChapterDto: UpdateSubChapterDto,
  ): Promise<SubChapter> {
    const subChapter = await this.subChapterService.update(id, updateSubChapterDto);
    if (!subChapter) {
      throw new Error('SubChapter not found');
    }
    return subChapter;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subchapter by ID' })
  @ApiResponse({ status: 204, description: 'SubChapter successfully deleted.' })
  @ApiResponse({ status: 404, description: 'SubChapter not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await this.subChapterService.remove(id);
    if (!result) {
      throw new Error('SubChapter not found');
    }
  }
}