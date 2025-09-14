import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNoticeDto {
  @ApiProperty({ 
    example: 'Important Notice', 
    description: 'Notice subheading (5-200 characters)',
    minLength: 5,
    maxLength: 200
  })
  @IsString({ message: 'Subheading must be a string' })
  @IsNotEmpty({ message: 'Subheading is required' })
  @MinLength(5, { message: 'Subheading must be at least 5 characters long' })
  @MaxLength(200, { message: 'Subheading must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/, { 
    message: 'Subheading contains invalid characters' 
  })
  subHeading!: string;

  @ApiProperty({ 
    example: 'This is an important notice description with detailed information...', 
    description: 'Notice description (minimum 10 characters)',
    minLength: 10
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @Transform(({ value }) => value?.trim())
  description!: string;
}
