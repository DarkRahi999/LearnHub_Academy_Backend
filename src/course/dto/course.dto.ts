import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ 
    example: 'Web Development Fundamentals', 
    description: 'Course title (5-200 characters)',
    minLength: 5,
    maxLength: 200
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/, { 
    message: 'Title contains invalid characters' 
  })
  title!: string;

  @ApiProperty({ 
    example: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript...', 
    description: 'Course description (minimum 10 characters)',
    minLength: 10
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @Transform(({ value }) => value?.trim())
  description!: string;

  @ApiProperty({ 
    example: 'Perfect for beginners who want to start their web development journey', 
    description: 'Course highlight (5-300 characters)',
    minLength: 5,
    maxLength: 300
  })
  @IsString({ message: 'Highlight must be a string' })
  @IsNotEmpty({ message: 'Highlight is required' })
  @MinLength(5, { message: 'Highlight must be at least 5 characters long' })
  @MaxLength(300, { message: 'Highlight must not exceed 300 characters' })
  @Transform(({ value }) => value?.trim())
  highlight!: string;

  @ApiProperty({ 
    example: '/img/courses/web-dev.jpg', 
    description: 'Course image URL (optional)',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;
}