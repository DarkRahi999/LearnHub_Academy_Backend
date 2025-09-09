import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../utils/enums';

export class SignupDto {
  @ApiProperty({
    description: 'Unique email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'rahim01',
  })
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @ApiProperty({
    description: 'First name',
    example: 'Rahim',
  })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Uddin',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.Male,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;

  @ApiPropertyOptional({
    description: 'Date of birth (ISO)',
    example: '2000-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'BD',
    required: false,
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Religion',
    example: 'Islam',
    required: false,
  })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiProperty({
    description: 'Accept terms and conditions',
    example: true,
  })
  @IsBoolean()
  acceptTerms!: boolean;

  @ApiProperty({
    description: 'Account password',
    minLength: 6,
    example: 'secret123',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsNotEmpty()
  avatarUrl!: string;
}
