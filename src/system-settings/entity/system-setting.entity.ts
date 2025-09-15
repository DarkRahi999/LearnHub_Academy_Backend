import { Entity, PrimaryKey, Property, OptionalProps, Enum } from '@mikro-orm/core';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

export enum SettingCategory {
  GENERAL = 'general',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  APPEARANCE = 'appearance',
}

@Entity({ tableName: 'system_settings' })
export class SystemSetting {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey()
  id!: number;

  @Property({ length: 100, unique: true })
  key!: string;

  @Property({ type: 'text' })
  value!: string;

  @Enum({ items: () => SettingType })
  type!: SettingType;

  @Enum({ items: () => SettingCategory })
  category!: SettingCategory;

  @Property({ length: 255 })
  name!: string;

  @Property({ length: 500, nullable: true })
  description?: string;

  @Property({ default: false })
  isPublic!: boolean; // Whether setting is accessible to non-admin users

  @Property({ default: true })
  isEditable!: boolean; // Whether setting can be modified

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}