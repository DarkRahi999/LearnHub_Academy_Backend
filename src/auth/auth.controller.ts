import { Body, Controller, Get, Post, Req, UseGuards, Patch, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { RoleGuard, Roles, RequirePermissions } from './role.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  // Removed separate avatar endpoint; use PATCH /auth/profile instead

  @Patch('profile')
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin/Super Admin only)' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Put('users/:id/role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin/Super Admin only)' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
  async updateUserRole(@Param('id') userId: string, @Body() body: { role: UserRole }) {
    return this.authService.updateUserRole(userId, body.role);
  }

  @Get('permissions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user permissions' })
  async getUserPermissions(@Req() req: any) {
    return this.authService.getUserPermissions(req.user.role);
  }

  @Get('role-info')
  @ApiBearerAuth()
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
