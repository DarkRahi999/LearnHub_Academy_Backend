import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { SettingType, SettingCategory } from '../entity/system-setting.entity';

export class CreateSystemSettingDto {
  @ApiProperty({
    description: 'Unique key for the setting',
    example: 'app_name',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: 'Setting value as string',
    example: 'LearnHub Academy',
  })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({
    description: 'Type of the setting value',
    enum: SettingType,
    example: SettingType.STRING,
  })
  @IsEnum(SettingType)
  type!: SettingType;

  @ApiProperty({
    description: 'Category of the setting',
    enum: SettingCategory,
    example: SettingCategory.GENERAL,
  })
  @IsEnum(SettingCategory)
  category!: SettingCategory;

  @ApiProperty({
    description: 'Human-readable name for the setting',
    example: 'Application Name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Description of what this setting does',
    example: 'The name displayed across the application',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether setting is accessible to non-admin users',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether setting can be modified',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;
}