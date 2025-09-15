import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { SystemSetting, SettingType, SettingCategory } from './entity/system-setting.entity';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { UserRole } from '../utils/enums';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepo: EntityRepository<SystemSetting>,
  ) {}

  async createSetting(createDto: CreateSystemSettingDto, currentUser: any): Promise<SystemSetting> {
    // Only super admin can create settings
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only Super Admin can create system settings');
    }

    // Check if setting with this key already exists
    const existingSetting = await this.settingRepo.findOne({ key: createDto.key });
    if (existingSetting) {
      throw new BadRequestException(`Setting with key '${createDto.key}' already exists`);
    }

    // Validate value based on type
    this.validateValue(createDto.value, createDto.type);

    const setting = this.settingRepo.create({
      key: createDto.key,
      value: createDto.value,
      type: createDto.type,
      category: createDto.category,
      name: createDto.name,
      description: createDto.description,
      isPublic: createDto.isPublic || false,
      isEditable: createDto.isEditable !== false, // Default to true
    });

    await this.settingRepo.getEntityManager().persistAndFlush(setting);
    return setting;
  }

  async getAllSettings(currentUser: any): Promise<SystemSetting[]> {
    // Super admin can see all settings
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return this.settingRepo.findAll({ orderBy: { category: 'ASC', name: 'ASC' } });
    }

    // Other users can only see public settings
    return this.settingRepo.find(
      { isPublic: true },
      { orderBy: { category: 'ASC', name: 'ASC' } }
    );
  }

  async getSettingsByCategory(category: SettingCategory, currentUser: any): Promise<SystemSetting[]> {
    const whereClause: any = { category };
    
    // Non-super admin users can only see public settings
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      whereClause.isPublic = true;
    }

    return this.settingRepo.find(whereClause, { orderBy: { name: 'ASC' } });
  }

  async getSettingByKey(key: string, currentUser: any): Promise<SystemSetting> {
    const setting = await this.settingRepo.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    // Check if user can access this setting
    if (!setting.isPublic && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Access denied to this setting');
    }

    return setting;
  }

  async updateSetting(key: string, updateDto: UpdateSystemSettingDto, currentUser: any): Promise<SystemSetting> {
    const setting = await this.settingRepo.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    // Check if setting is editable
    if (!setting.isEditable) {
      throw new BadRequestException('This setting cannot be modified');
    }

    // Only super admin can update settings
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only Super Admin can update system settings');
    }

    // Validate value if provided
    if (updateDto.value !== undefined) {
      const valueType = updateDto.type || setting.type;
      this.validateValue(updateDto.value, valueType);
      setting.value = updateDto.value;
    }

    // Update other fields
    if (updateDto.type !== undefined) setting.type = updateDto.type;
    if (updateDto.category !== undefined) setting.category = updateDto.category;
    if (updateDto.name !== undefined) setting.name = updateDto.name;
    if (updateDto.description !== undefined) setting.description = updateDto.description;
    if (updateDto.isPublic !== undefined) setting.isPublic = updateDto.isPublic;
    if (updateDto.isEditable !== undefined) setting.isEditable = updateDto.isEditable;

    await this.settingRepo.getEntityManager().persistAndFlush(setting);
    return setting;
  }

  async deleteSetting(key: string, currentUser: any): Promise<void> {
    // Only super admin can delete settings
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only Super Admin can delete system settings');
    }

    const setting = await this.settingRepo.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    // Check if setting is editable (non-editable settings shouldn't be deleted)
    if (!setting.isEditable) {
      throw new BadRequestException('This setting cannot be deleted');
    }

    await this.settingRepo.getEntityManager().removeAndFlush(setting);
  }

  async getSettingValue(key: string): Promise<any> {
    const setting = await this.settingRepo.findOne({ key });
    if (!setting) {
      return null;
    }

    return this.parseValue(setting.value, setting.type);
  }

  async setSettingValue(key: string, value: any, currentUser: any): Promise<void> {
    const setting = await this.settingRepo.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    if (!setting.isEditable) {
      throw new BadRequestException('This setting cannot be modified');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only Super Admin can update system settings');
    }

    const stringValue = this.stringifyValue(value, setting.type);
    this.validateValue(stringValue, setting.type);

    setting.value = stringValue;
    await this.settingRepo.getEntityManager().persistAndFlush(setting);
  }

  private validateValue(value: string, type: SettingType): void {
    switch (type) {
      case SettingType.NUMBER:
        if (isNaN(Number(value))) {
          throw new BadRequestException('Value must be a valid number');
        }
        break;
      case SettingType.BOOLEAN:
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new BadRequestException('Value must be true or false');
        }
        break;
      case SettingType.JSON:
        try {
          JSON.parse(value);
        } catch {
          throw new BadRequestException('Value must be valid JSON');
        }
        break;
      // STRING type doesn't need validation
    }
  }

  private parseValue(value: string, type: SettingType): any {
    switch (type) {
      case SettingType.NUMBER:
        return Number(value);
      case SettingType.BOOLEAN:
        return value.toLowerCase() === 'true';
      case SettingType.JSON:
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private stringifyValue(value: any, type: SettingType): string {
    switch (type) {
      case SettingType.JSON:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  // Initialize default settings
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: 'app_name',
        value: 'LearnHub Academy',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        name: 'Application Name',
        description: 'The name displayed across the application',
        isPublic: true,
        isEditable: true,
      },
      {
        key: 'app_description',
        value: 'A comprehensive learning management system',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        name: 'Application Description',
        description: 'Brief description of the application',
        isPublic: true,
        isEditable: true,
      },
      {
        key: 'max_login_attempts',
        value: '5',
        type: SettingType.NUMBER,
        category: SettingCategory.SECURITY,
        name: 'Maximum Login Attempts',
        description: 'Maximum number of failed login attempts before account lockout',
        isPublic: false,
        isEditable: true,
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        type: SettingType.BOOLEAN,
        category: SettingCategory.MAINTENANCE,
        name: 'Maintenance Mode',
        description: 'Enable/disable maintenance mode',
        isPublic: false,
        isEditable: true,
      },
      {
        key: 'email_notifications',
        value: 'true',
        type: SettingType.BOOLEAN,
        category: SettingCategory.EMAIL,
        name: 'Email Notifications',
        description: 'Enable/disable email notifications',
        isPublic: false,
        isEditable: true,
      },
    ];

    for (const settingData of defaultSettings) {
      const existingSetting = await this.settingRepo.findOne({ key: settingData.key });
      if (!existingSetting) {
        const setting = this.settingRepo.create(settingData);
        await this.settingRepo.getEntityManager().persist(setting);
      }
    }

    await this.settingRepo.getEntityManager().flush();
  }
}