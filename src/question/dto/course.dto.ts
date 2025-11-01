import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateQuestionCourseDto {
  @ApiProperty({ example: 'Mathematics', description: 'The name of the course' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Basic mathematics course for beginners', description: 'The description of the course' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateQuestionCourseDto {
  @ApiPropertyOptional({ example: 'Advanced Mathematics', description: 'The name of the course' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Advanced mathematics course', description: 'The description of the course' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CourseRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Mathematics', description: 'The name of the course' })
  name: string;

  @ApiPropertyOptional({ example: 'Basic mathematics course for beginners', description: 'The description of the course' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}