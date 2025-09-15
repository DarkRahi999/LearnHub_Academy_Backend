import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, Roles } from '../auth/role.guard';
import { UserRole } from '../utils/enums';
import { SettingCategory } from './entity/system-setting.entity';

@ApiTags('System Settings')
@Controller('system-settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new system setting (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or duplicate key' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createSetting(@Body() createDto: CreateSystemSettingDto, @Req() req: any) {
    return this.systemSettingsService.createSetting(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiQuery({ name: 'category', enum: SettingCategory, required: false, description: 'Filter by category' })
  async getAllSettings(@Query('category') category: SettingCategory, @Req() req: any) {
    if (category) {
      return this.systemSettingsService.getSettingsByCategory(category, req.user);
    }
    return this.systemSettingsService.getAllSettings(req.user);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public system settings (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Public settings retrieved successfully' })
  async getPublicSettings() {
    // Create a mock user object for public access
    const publicUser = { role: UserRole.USER };
    return this.systemSettingsService.getAllSettings(publicUser);
  }

  @Get('categories/:category')
  @ApiOperation({ summary: 'Get settings by category' })
  @ApiParam({ name: 'category', enum: SettingCategory, description: 'Setting category' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettingsByCategory(@Param('category') category: SettingCategory, @Req() req: any) {
    return this.systemSettingsService.getSettingsByCategory(category, req.user);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this setting' })
  async getSettingByKey(@Param('key') key: string, @Req() req: any) {
    return this.systemSettingsService.getSettingByKey(key, req.user);
  }

  @Get(':key/value')
  @ApiOperation({ summary: 'Get parsed value of a specific setting' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting value retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  async getSettingValue(@Param('key') key: string, @Req() req: any) {
    // First check if user can access this setting
    await this.systemSettingsService.getSettingByKey(key, req.user);
    const value = await this.systemSettingsService.getSettingValue(key);
    return { key, value };
  }

  @Put(':key')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a system setting (Super Admin only)' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or setting not editable' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemSettingDto,
    @Req() req: any,
  ) {
    return this.systemSettingsService.updateSetting(key, updateDto, req.user);
  }

  @Put(':key/value')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update only the value of a system setting (Super Admin only)' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting value updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or setting not editable' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async setSettingValue(
    @Param('key') key: string,
    @Body() body: { value: any },
    @Req() req: any,
  ) {
    await this.systemSettingsService.setSettingValue(key, body.value, req.user);
    return { message: 'Setting value updated successfully' };
  }

  @Delete(':key')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a system setting (Super Admin only)' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - setting not editable' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async deleteSetting(@Param('key') key: string, @Req() req: any) {
    await this.systemSettingsService.deleteSetting(key, req.user);
    return { message: 'Setting deleted successfully' };
  }

  @Post('initialize')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Initialize default system settings (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Default settings initialized successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async initializeDefaultSettings() {
    await this.systemSettingsService.initializeDefaultSettings();
    return { message: 'Default settings initialized successfully' };
  }
}