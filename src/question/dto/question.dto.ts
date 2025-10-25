import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Newton\'s First Law Question', description: 'The name of the question' })
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

  @ApiProperty({ example: 1, description: 'The ID of the chapter' })
  @IsInt()
  chapterId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subchapter' })
  @IsInt()
  subChapterId: number;

  @ApiProperty({ example: 'What is Newton\'s first law of motion?', description: 'The question text' })
  @IsString()
  questionText: string;

  @ApiProperty({ example: 'An object at rest stays at rest', description: 'Option A' })
  @IsString()
  optionA: string;

  @ApiProperty({ example: 'An object in motion stays in motion', description: 'Option B' })
  @IsString()
  optionB: string;

  @ApiProperty({ example: 'Both A and B', description: 'Option C' })
  @IsString()
  optionC: string;

  @ApiProperty({ example: 'None of the above', description: 'Option D' })
  @IsString()
  optionD: string;

  @ApiProperty({ example: 'C', description: 'The correct answer (A, B, C, or D)' })
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional({ example: 'This question tests understanding of Newton\'s first law', description: 'The description of the question' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Advanced Newton\'s First Law Question', description: 'The name of the question' })
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

  @ApiPropertyOptional({ example: 1, description: 'The ID of the chapter' })
  @IsInt()
  @IsOptional()
  chapterId?: number;

  @ApiPropertyOptional({ example: 1, description: 'The ID of the subchapter' })
  @IsInt()
  @IsOptional()
  subChapterId?: number;

  @ApiPropertyOptional({ example: 'What is Newton\'s first law of motion in detail?', description: 'The question text' })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiPropertyOptional({ example: 'An object at rest stays at rest unless acted upon by an external force', description: 'Option A' })
  @IsString()
  @IsOptional()
  optionA?: string;

  @ApiPropertyOptional({ example: 'An object in motion stays in motion unless acted upon by an external force', description: 'Option B' })
  @IsString()
  @IsOptional()
  optionB?: string;

  @ApiPropertyOptional({ example: 'Both A and B', description: 'Option C' })
  @IsString()
  @IsOptional()
  optionC?: string;

  @ApiPropertyOptional({ example: 'None of the above', description: 'Option D' })
  @IsString()
  @IsOptional()
  optionD?: string;

  @ApiPropertyOptional({ example: 'C', description: 'The correct answer (A, B, C, or D)' })
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 'This advanced question tests detailed understanding of Newton\'s first law', description: 'The description of the question' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class QuestionRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Newton\'s First Law Question', description: 'The name of the question' })
  name: string;

  @ApiProperty({ example: 1, description: 'The ID of the course' })
  courseId: number;

  @ApiProperty({ example: 1, description: 'The ID of the group' })
  groupId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subject' })
  subjectId: number;

  @ApiProperty({ example: 1, description: 'The ID of the chapter' })
  chapterId: number;

  @ApiProperty({ example: 1, description: 'The ID of the subchapter' })
  subChapterId: number;

  @ApiProperty({ example: 'What is Newton\'s first law of motion?', description: 'The question text' })
  questionText: string;

  @ApiProperty({ example: 'An object at rest stays at rest', description: 'Option A' })
  optionA: string;

  @ApiProperty({ example: 'An object in motion stays in motion', description: 'Option B' })
  optionB: string;

  @ApiProperty({ example: 'Both A and B', description: 'Option C' })
  optionC: string;

  @ApiProperty({ example: 'None of the above', description: 'Option D' })
  optionD: string;

  @ApiProperty({ example: 'C', description: 'The correct answer (A, B, C, or D)' })
  correctAnswer: string;

  @ApiPropertyOptional({ example: 'This question tests understanding of Newton\'s first law', description: 'The description of the question' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}