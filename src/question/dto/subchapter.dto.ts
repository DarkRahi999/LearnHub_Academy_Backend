import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSubChapterDto {
  @ApiProperty({ example: 'Newton\'s Laws', description: 'The name of the subchapter' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the chapter' })
  @IsInt()
  chapterId: number;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  @IsInt()
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @IsInt()
  groupId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subject' })
  @IsInt()
  subjectId: number;

  @ApiPropertyOptional({ example: 'Detailed explanation of Newton\'s laws', description: 'The description of the subchapter' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubChapterDto {
  @ApiPropertyOptional({ example: 'Advanced Newton\'s Laws', description: 'The name of the subchapter' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the chapter' })
  @IsInt()
  @IsOptional()
  chapterId?: number;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the course' })
  @IsInt()
  @IsOptional()
  courseId?: number;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the group' })
  @IsInt()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the subject' })
  @IsInt()
  @IsOptional()
  subjectId?: number;

  @ApiPropertyOptional({ example: 'Advanced explanation of Newton\'s laws', description: 'The description of the subchapter' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SubChapterRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Newton\'s Laws', description: 'The name of the subchapter' })
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the chapter' })
  chapterId: number;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  groupId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subject' })
  subjectId: number;

  @ApiPropertyOptional({ example: 'Detailed explanation of Newton\'s laws', description: 'The description of the subchapter' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}