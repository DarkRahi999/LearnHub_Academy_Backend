import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Login by email',
    example: 'user@example.com'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password',
    minLength: 6,
    example: 'secret123'
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
