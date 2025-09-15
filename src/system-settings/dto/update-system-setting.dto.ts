import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { SettingType, SettingCategory } from '../entity/system-setting.entity';

export class UpdateSystemSettingDto {
  @ApiPropertyOptional({
    description: 'Setting value as string',
    example: 'Updated Application Name',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    description: 'Type of the setting value',
    enum: SettingType,
  })
  @IsOptional()
  @IsEnum(SettingType)
  type?: SettingType;

  @ApiPropertyOptional({
    description: 'Category of the setting',
    enum: SettingCategory,
  })
  @IsOptional()
  @IsEnum(SettingCategory)
  category?: SettingCategory;

  @ApiPropertyOptional({
    description: 'Human-readable name for the setting',
    example: 'Updated Application Name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of what this setting does',
    example: 'Updated description for the setting',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether setting is accessible to non-admin users',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether setting can be modified',
  })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;
}