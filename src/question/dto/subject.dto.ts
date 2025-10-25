import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Physics', description: 'The name of the subject' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  @IsInt()
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  @IsInt()
  groupId: number;

  @ApiPropertyOptional({ example: 'Basic physics concepts', description: 'The description of the subject' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Advanced Physics', description: 'The name of the subject' })
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

  @ApiPropertyOptional({ example: 'Advanced physics concepts', description: 'The description of the subject' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SubjectRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Physics', description: 'The name of the subject' })
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  groupId: number;

  @ApiPropertyOptional({ example: 'Basic physics concepts', description: 'The description of the subject' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}