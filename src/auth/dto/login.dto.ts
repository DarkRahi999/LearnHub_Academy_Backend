import { IsEmail, IsString, MinLength, Validate, ValidateIf, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'EmailOrUserNameXor', async: false })
class EmailOrUserNameXor implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as LoginDto;
    const hasEmail = !!obj.email;
    const hasUser = !!obj.userName;
    return (hasEmail || hasUser) && !(hasEmail && hasUser);
  }
  defaultMessage() {
    return 'Provide exactly one of email or userName';
  }
}

export class LoginDto {
  @ApiPropertyOptional({ description: 'Login by email (mutually exclusive with userName)', example: 'user@example.com' })
  @ValidateIf(o => !o.userName)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Login by userName (mutually exclusive with email)', example: 'rahim01' })
  @ValidateIf(o => !o.email)
  @IsString()
  userName?: string;

  @ApiProperty({ description: 'Account password', minLength: 6, example: 'secret123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @Validate(EmailOrUserNameXor)
  private _xor?: string;
}
