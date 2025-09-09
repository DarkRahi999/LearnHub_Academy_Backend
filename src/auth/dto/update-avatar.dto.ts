import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'New avatar image URL',
    example: 'https://example.com/new-avatar.png',
  })
  @IsString()
  avatarUrl!: string;
}
