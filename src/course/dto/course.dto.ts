import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches, IsUrl, IsNumber, Min, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
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
    example: 'Perfect for beginners', 
    description: 'Course highlight (5-50 characters)',
    minLength: 5,
    maxLength: 50
  })
  @IsString({ message: 'Highlight must be a string' })
  @IsNotEmpty({ message: 'Highlight is required' })
  @MinLength(5, { message: 'Highlight must be at least 5 characters long' })
  @MaxLength(50, { message: 'Highlight must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  highlight!: string;

  @ApiProperty({
    example: ['Learn HTML basics', 'Master CSS styling', 'Build responsive websites'],
    description: 'Pointed text items (3-5 items)',
    type: [String],
    minItems: 3,
    maxItems: 5
  })
  @IsArray({ message: 'Pointed text must be an array' })
  @ArrayMinSize(3, { message: 'Pointed text must have at least 3 items' })
  @ArrayMaxSize(5, { message: 'Pointed text must have at most 5 items' })
  @IsString({ each: true, message: 'Each pointed text item must be a string' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((item: string) => item?.trim());
    }
    return value;
  })
  pointedText!: string[];

  @ApiProperty({ 
    example: '/img/courses/web-dev.jpg', 
    description: 'Course image URL (optional)',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  imageUrl?: string;

  @ApiProperty({ 
    example: 29.99, 
    description: 'Course regular price in decimal format (optional)',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number;

  @ApiProperty({ 
    example: 19.99, 
    description: 'Course discount price in decimal format (optional)',
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Discount price must be a number' })
  @Min(0, { message: 'Discount price must be greater than or equal to 0' })
  discountPrice?: number;
}