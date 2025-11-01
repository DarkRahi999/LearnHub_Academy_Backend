import { IsString, IsOptional, IsInt, IsArray, IsDateString, IsBoolean, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  examDate: Date;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(1)
  duration: number; // in minutes

  @IsInt()
  @Min(10)
  totalQuestions: number; // total number of questions expected

  @IsArray()
  @IsInt({ each: true })
  questionIds: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}