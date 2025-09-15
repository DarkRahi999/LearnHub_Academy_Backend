import { Body, Controller, Get, Post, Req, UseGuards, Patch, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RoleGuard, Roles, RequirePermissions } from './role.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UserRole, Permission } from '../utils/enums';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @ApiBody({ type: SignupDto })
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }


  @Get('validate')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
  validateToken(@Req() req: any) {
    return { 
      valid: true, 
      user: req.user,
      message: 'Token is valid' 
    };
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  // Removed separate avatar endpoint; use PATCH /auth/profile instead

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Post('forgot-password')
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  // Role Management Endpoints
  @Get('users')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with optional search and pagination (Admin/Super Admin only)' })
  async getAllUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.authService.getAllUsers({ search, role, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 10 });
  }

  @Get('users/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin/Super Admin only)' })
  async getUserById(@Param('id') userId: string) {
    return this.authService.getUserById(userId);
  }

  @Put('users/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user details (Admin/Super Admin only)' })
  @ApiBody({ type: UpdateProfileDto })
  async updateUser(@Param('id') userId: string, @Body() updateData: UpdateProfileDto, @Req() req: any) {
    return this.authService.updateUser(userId, updateData, req.user);
  }

  @Put('users/:id/role')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin/Super Admin only)' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
  async updateUserRole(@Param('id') userId: string, @Body() body: { role: UserRole }, @Req() req: any) {
    return this.authService.updateUserRole(userId, body.role, req.user);
  }

  @Put('users/:id/status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Block/Unblock user (Admin/Super Admin only)' })
  @ApiBody({ schema: { type: 'object', properties: { isBlocked: { type: 'boolean' } } } })
  async updateUserStatus(@Param('id') userId: string, @Body() body: { isBlocked: boolean }, @Req() req: any) {
    return this.authService.updateUserStatus(userId, body.isBlocked, req.user);
  }

  @Delete('users/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  async deleteUser(@Param('id') userId: string, @Req() req: any) {
    return this.authService.deleteUser(userId, req.user);
  }

  @Post('users/bulk-action')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk actions on users (Admin/Super Admin only)' })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: { 
      userIds: { type: 'array', items: { type: 'string' } },
      action: { type: 'string', enum: ['delete', 'block', 'unblock', 'role_change'] },
      role: { type: 'string', enum: Object.values(UserRole) }
    },
    required: ['userIds', 'action']
  } })
  async bulkUserAction(
    @Body() body: { userIds: string[]; action: 'delete' | 'block' | 'unblock' | 'role_change'; role?: UserRole },
    @Req() req: any
  ) {
    return this.authService.bulkUserAction(body.userIds, body.action, req.user, body.role);
  }

  @Post('users/create')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new user (Admin/Super Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    return this.authService.createUser(createUserDto, req.user.id);
  }

  @Get('permissions')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user permissions' })
  async getUserPermissions(@Req() req: any) {
    return this.authService.getUserPermissions(req.user.role);
  }

  @Get('role-info')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user role information' })
  async getRoleInfo(@Req() req: any) {
    return this.authService.getRoleInfo(req.user.role);
  }

  // Development only - Create Super Admin
  @Post('create-super-admin')
  @ApiOperation({ summary: 'Create Super Admin account (Development only)' })
  @ApiBody({ type: CreateSuperAdminDto })
  async createSuperAdmin(@Body() body: CreateSuperAdminDto) {
    return this.authService.createSuperAdmin(body);
  }
}
