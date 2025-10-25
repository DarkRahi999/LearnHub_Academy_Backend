import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Science', description: 'The name of the group' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  @IsInt()
  courseId: number;

  @ApiPropertyOptional({ example: 'Science group for science students', description: 'The description of the group' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Advanced Science', description: 'The name of the group' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the course' })
  @IsInt()
  @IsOptional()
  courseId?: number;

  @ApiPropertyOptional({ example: 'Advanced science group', description: 'The description of the group' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class GroupRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Science', description: 'The name of the group' })
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  courseId: number;

  @ApiPropertyOptional({ example: 'Science group for science students', description: 'The description of the group' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}