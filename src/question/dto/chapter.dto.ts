import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ example: 'Mechanics', description: 'The name of the chapter' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  @IsInt()
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @IsInt()
  groupId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subject' })
  @IsInt()
  subjectId: number;

  @ApiPropertyOptional({ example: 'Basic mechanics concepts', description: 'The description of the chapter' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateChapterDto {
  @ApiPropertyOptional({ example: 'Advanced Mechanics', description: 'The name of the chapter' })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ example: 'Advanced mechanics concepts', description: 'The description of the chapter' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ChapterRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Mechanics', description: 'The name of the chapter' })
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  groupId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subject' })
  subjectId: number;

  @ApiPropertyOptional({ example: 'Basic mechanics concepts', description: 'The description of the chapter' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}