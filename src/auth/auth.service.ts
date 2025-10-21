import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { User } from './entity/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpCode } from './entity/otp.entity';
import * as nodemailer from 'nodemailer';
import { Gender, UserRole } from '../utils/enums';
import * as bcrypt from 'bcryptjs';
import { RolePermissionsService } from './role-permissions.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    @InjectRepository(OtpCode) private readonly otpRepo: EntityRepository<OtpCode>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) { }

  async signPayload<T extends object>(payload: T): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async signup(data: SignupDto) {
    if (!data.acceptTerms) {
      throw new BadRequestException('You must accept terms and conditions');
    }

    // Check for existing email
    const existingEmail = await this.userRepo.findOne({ email: data.email });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Check for existing phone
    const existingPhone = await this.userRepo.findOne({ phone: data.phone });
    if (existingPhone) {
      throw new BadRequestException('Phone number already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);


    const user = this.userRepo.create({
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender as Gender | Gender.Male,
      role: UserRole.USER, // Default role for new users
      dob: (data.dob && data.dob.trim() !== '') ? new Date(data.dob) : undefined,
      nationality: data.nationality,
      religion: data.religion,
      acceptTerms: data.acceptTerms,
      avatarUrl: data.avatarUrl || '/default-user.svg',
      passwordHash,
    });
    await this.userRepo.getEntityManager().persistAndFlush(user);
    const token = await this.signPayload({
      sub: String(user.id),
      email: user.email,
      role: user.role
    });
    return { user: this.sanitize(user), access_token: token };
  }

  async login(data: LoginDto) {
    const user = await this.userRepo.findOne({ email: data.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked. Please contact admin.');
    }

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepo.getEntityManager().persistAndFlush(user);

    const token = await this.signPayload({
      sub: String(user.id),
      email: user.email,
      role: user.role
    });
    return { user: this.sanitize(user), access_token: token };
  }

  private generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async sendMail(to: string, subject: string, html: string) {
    try {
      // Use ConfigService to get environment variables with fallbacks
      const userEmail = this.configService.get<string>('MAIL_USER') || 'usera2lite789@gmail.com';
      const appPassword = this.configService.get<string>('MAIL_PASS') || 'digkzlwkzvrxtsab'; // Your working password

      // Validate credentials
      if (!userEmail || !appPassword) {
        throw new Error('Email credentials are missing');
      }

      // Ensure credentials are strings and not empty
      const user = String(userEmail).trim();
      const pass = String(appPassword).trim();

      if (!user || !pass) {
        throw new Error('Email credentials are invalid or empty');
      }

      // Gmail configuration with explicit SMTP settings
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
        port: this.configService.get<number>('MAIL_PORT') || 587,
        secure: this.configService.get<string>('MAIL_SECURE') === 'true',
        auth: {
          user: user,
          pass: pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"LearnHub Academy" <${user}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      // Provide specific error messages based on the error type
      if (error.message.includes('Missing credentials')) {
        throw new BadRequestException('Email configuration error: Missing or invalid credentials.');
      }

      if (error.message.includes('BadCredentials') || error.message.includes('Invalid login')) {
        throw new BadRequestException('Email authentication failed. Please check: 1) App Password is correct, 2) 2-Factor Authentication is enabled.');
      }

      // Generic error message
      throw new BadRequestException('Failed to send OTP email. Please try again. Error: ' + error.message);
    }
  }


  private sanitize(user: User) {
    const { passwordHash, ...rest } = user as any;
    return {
      ...rest,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      dob: user.dob?.toISOString() || null,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString()
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return { user: this.sanitize(user) };
  }

  // Removed: updateAvatar (use updateProfile instead)

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      gender?: Gender;
      dob?: string;
      nationality?: string;
      religion?: string;
      avatarUrl?: string;
      emailNoticeEnabled?: boolean;
    },
  ) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check for email uniqueness if email is being updated
    if (typeof data.email !== 'undefined' && data.email !== user.email) {
      const existingUser = await this.userRepo.findOne({ email: data.email });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check for phone uniqueness if phone is being updated
    if (typeof data.phone !== 'undefined' && data.phone !== user.phone) {
      const existingUser = await this.userRepo.findOne({ phone: data.phone });
      if (existingUser) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    if (typeof data.firstName !== 'undefined') user.firstName = data.firstName;
    if (typeof data.lastName !== 'undefined') user.lastName = data.lastName;
    if (typeof data.email !== 'undefined') user.email = data.email;
    if (typeof data.phone !== 'undefined') user.phone = data.phone as any;
    if (typeof data.gender !== 'undefined') user.gender = data.gender as any;
    if (typeof data.dob !== 'undefined') {
      // Handle empty string as undefined for date field
      if (data.dob && data.dob.trim() !== '') {
        user.dob = new Date(data.dob);
      } else {
        user.dob = undefined;
      }
    }
    if (typeof data.nationality !== 'undefined') user.nationality = data.nationality as any;
    if (typeof data.religion !== 'undefined') user.religion = data.religion as any;
    if (typeof data.avatarUrl !== 'undefined') user.avatarUrl = data.avatarUrl as any;
    if (typeof data.emailNoticeEnabled !== 'undefined') user.emailNoticeEnabled = data.emailNoticeEnabled as any;

    await this.userRepo.getEntityManager().persistAndFlush(user);
    return { user: this.sanitize(user) };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw new BadRequestException('Email not found in our database');
    }

    // Check for recent OTP requests (rate limiting)
    const recentOtp = await this.otpRepo.findOne(
      { email, createdAt: { $gte: new Date(Date.now() - 60 * 1000) } }, // Last 1 minute
      { orderBy: { createdAt: 'DESC' } }
    );

    if (recentOtp) {
      throw new BadRequestException('Please wait 1 minute before requesting another OTP');
    }

    // Invalidate any existing unconsumed OTPs for this email
    const existingOtps = await this.otpRepo.find({ email, consumed: false });
    for (const existingOtp of existingOtps) {
      existingOtp.consumed = true;
      await this.otpRepo.getEntityManager().persist(existingOtp);
    }

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const otp = this.otpRepo.create({
      email,
      code,
      expiresAt,
      attempts: 0,
      consumed: false,
      createdAt: new Date()
    });
    await this.otpRepo.getEntityManager().persistAndFlush(otp);

    // Send email with proper error handling
    await this.sendMail(
      email,
      'Password Reset OTP - LearnHub Academy',
      `<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <!-- Header -->
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #4F46E5;">
          <h1 style="color: #4F46E5; font-size: 24px; font-weight: bold; margin: 0;">LearnHub Academy</h1>
          <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0;">Your Learning Platform</p>
        </div>

        <!-- Content -->
        <div style="padding-top: 12px; padding-bottom: 12px;">
          <h2 style="color: #1F2937; font-size: 20px; font-weight: bold;">Password Reset Request</h2>
          <p style="margin-top: 12px;">Hello,</p>
          <p style="margin-top: 8px; font-size: 14px;">We received a request to reset your password. Use the following OTP code to complete the process:</p>

          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #000000; letter-spacing: 0.2em; padding-bottom: 8px; border-bottom: 2px dashed #4F46E5; display: inline-block;">
              ${code}
            </span>
          </div>

          <p style="background-color: #FEE2E2; padding: 16px; border-left: 4px solid #EF4444; border-radius: 4px;">
            <strong>Note:</strong> This OTP will expire in 5 minutes. If you didn't request this password reset, please ignore this email.
          </p>

          <p style="margin-top: 16px;">Thank you for using LearnHub Academy!</p>
        </div>

        <!-- Footer -->
        <div style="padding-top: 20px; padding-bottom: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 14px;">
          <p>© 2025 LearnHub Academy. All rights reserved.</p>
        </div>
      </div>`
    );

    return { message: 'Password reset OTP sent successfully to your email. Please check your inbox (and spam folder) for the 6-digit code.' };
  }

  async verifyOtp({ email, otp }: { email: string, otp: string }) {
    // Find the OTP
    const existing = await this.otpRepo.findOne({ email, consumed: false }, { orderBy: { createdAt: 'DESC' } });
    if (!existing) {
      throw new UnauthorizedException('OTP not found or already used');
    }

    // Check if OTP is expired
    if (existing.expiresAt.getTime() < Date.now()) {
      existing.consumed = true; // Mark expired OTP as consumed
      await this.otpRepo.getEntityManager().persistAndFlush(existing);
      throw new UnauthorizedException('OTP expired. Please request a new one.');
    }

    // Verify OTP code
    if (existing.code !== otp) {
      existing.attempts += 1;
      await this.otpRepo.getEntityManager().persistAndFlush(existing);

      // Block OTP after 3 failed attempts
      if (existing.attempts >= 3) {
        existing.consumed = true;
        await this.otpRepo.getEntityManager().persistAndFlush(existing);
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }

      throw new UnauthorizedException(`Invalid OTP. ${3 - existing.attempts} attempts remaining.`);
    }

    // OTP is valid - don't consume it yet as it will be used for password reset
    return { message: 'OTP verified successfully' };
  }

  async resetPassword({ email, otp, newPassword, confirmPassword }: ResetPasswordDto) {
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    // Find the OTP
    const existing = await this.otpRepo.findOne({ email, consumed: false }, { orderBy: { createdAt: 'DESC' } });
    if (!existing) {
      throw new UnauthorizedException('OTP not found or already used');
    }

    // Check if OTP is expired
    if (existing.expiresAt.getTime() < Date.now()) {
      existing.consumed = true; // Mark expired OTP as consumed
      await this.otpRepo.getEntityManager().persistAndFlush(existing);
      throw new UnauthorizedException('OTP expired. Please request a new one.');
    }

    // Verify OTP code
    if (existing.code !== otp) {
      existing.attempts += 1;
      await this.otpRepo.getEntityManager().persistAndFlush(existing);

      // Block OTP after 3 failed attempts
      if (existing.attempts >= 3) {
        existing.consumed = true;
        await this.otpRepo.getEntityManager().persistAndFlush(existing);
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }

      throw new UnauthorizedException(`Invalid OTP. ${3 - existing.attempts} attempts remaining.`);
    }

    // Mark OTP as consumed
    existing.consumed = true;
    await this.otpRepo.getEntityManager().persistAndFlush(existing);

    // Find user and update password
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepo.getEntityManager().persistAndFlush(user);

    return { message: 'Password updated successfully' };
  }

  // Role Management Methods
  async getAllUsers(params: { search?: string; role?: UserRole; page?: number; limit?: number } = {}) {
    const { search, role, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.$or = [
        { firstName: { $ilike: `%${search}%` } },
        { lastName: { $ilike: `%${search}%` } },
        { email: { $ilike: `%${search}%` } },
        { phone: { $ilike: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await this.userRepo.findAndCount(where, {
      offset,
      limit,
      orderBy: { createdAt: 'DESC' }
    });

    return {
      users: users.map(user => this.sanitize(user)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(userId: string) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return { user: this.sanitize(user) };
  }

  async updateUser(userId: string, updateData: any, currentUser: any) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if current user has permission to update this user
    if (!this.canManageUser(currentUser, user)) {
      throw new BadRequestException('You do not have permission to update this user');
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepo.findOne({ email: updateData.email });
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check for phone uniqueness if phone is being updated
    if (updateData.phone && updateData.phone !== user.phone) {
      const existingUser = await this.userRepo.findOne({ phone: updateData.phone });
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'gender', 'nationality', 'religion', 'avatarUrl'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (user as any)[field] = updateData[field];
      }
    }

    // Handle dob separately to properly handle empty strings
    if (updateData.dob !== undefined) {
      if (updateData.dob && updateData.dob.trim() !== '') {
        user.dob = new Date(updateData.dob);
      } else {
        user.dob = undefined;
      }
    }

    await this.userRepo.getEntityManager().persistAndFlush(user);
    return { user: this.sanitize(user), message: 'User updated successfully' };
  }

  async updateUserRole(userId: string, newRole: UserRole, currentUser: any) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if current user can assign this role
    if (!this.rolePermissionsService.canAssignRole(currentUser.role, newRole)) {
      throw new BadRequestException('You do not have permission to assign this role');
    }

    // Prevent self-demotion from super admin
    if (currentUser.userId === user.id && currentUser.role === UserRole.SUPER_ADMIN && newRole !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('You cannot demote yourself from Super Admin role');
    }

    user.role = newRole;
    await this.userRepo.getEntityManager().persistAndFlush(user);
    return { user: this.sanitize(user), message: 'User role updated successfully' };
  }

  async updateUserStatus(userId: string, isBlocked: boolean, currentUser: any) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if current user has permission to block/unblock users
    if (!this.canManageUser(currentUser, user)) {
      throw new BadRequestException('You do not have permission to modify this user');
    }

    // Prevent self-blocking
    if (currentUser.userId === user.id) {
      throw new BadRequestException('You cannot block/unblock yourself');
    }

    // Prevent blocking super admins by admins
    if (currentUser.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Admins cannot block Super Admins');
    }

    user.isBlocked = isBlocked;
    await this.userRepo.getEntityManager().persistAndFlush(user);

    const action = isBlocked ? 'blocked' : 'unblocked';
    return { user: this.sanitize(user), message: `User ${action} successfully` };
  }

  async deleteUser(userId: string, currentUser: any) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only super admin can delete users
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only Super Admin can delete users');
    }

    // Prevent self-deletion
    if (currentUser.userId === user.id) {
      throw new BadRequestException('You cannot delete yourself');
    }

    // Prevent deleting other super admins
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete Super Admin users');
    }

    await this.userRepo.getEntityManager().removeAndFlush(user);
    return { message: 'User deleted successfully' };
  }

  async bulkUserAction(userIds: string[], action: 'delete' | 'block' | 'unblock' | 'role_change', currentUser: any, newRole?: UserRole) {
    const users = await this.userRepo.find({ id: { $in: userIds.map(id => Number(id)) } });

    if (users.length === 0) {
      throw new BadRequestException('No users found');
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const user of users) {
      try {
        // Prevent actions on self
        if (currentUser.userId === user.id) {
          results.failed++;
          results.errors.push(`Cannot perform action on yourself (${user.email})`);
          continue;
        }

        switch (action) {
          case 'delete':
            if (currentUser.role !== UserRole.SUPER_ADMIN) {
              results.failed++;
              results.errors.push(`Only Super Admin can delete users (${user.email})`);
              continue;
            }
            if (user.role === UserRole.SUPER_ADMIN) {
              results.failed++;
              results.errors.push(`Cannot delete Super Admin (${user.email})`);
              continue;
            }
            await this.userRepo.getEntityManager().removeAndFlush(user);
            break;

          case 'block':
          case 'unblock':
            if (!this.canManageUser(currentUser, user)) {
              results.failed++;
              results.errors.push(`No permission to modify user (${user.email})`);
              continue;
            }
            user.isBlocked = action === 'block';
            await this.userRepo.getEntityManager().persistAndFlush(user);
            break;

          case 'role_change':
            if (!newRole) {
              results.failed++;
              results.errors.push(`Role not specified for user (${user.email})`);
              continue;
            }
            if (!this.rolePermissionsService.canAssignRole(currentUser.role, newRole)) {
              results.failed++;
              results.errors.push(`No permission to assign role to user (${user.email})`);
              continue;
            }
            user.role = newRole;
            await this.userRepo.getEntityManager().persistAndFlush(user);
            break;
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing user ${user.email}: ${error.message}`);
      }
    }

    return {
      message: `Bulk action completed. ${results.success} successful, ${results.failed} failed.`,
      results
    };
  }

  private canManageUser(currentUser: any, targetUser: User): boolean {
    // Super admin can manage everyone except themselves for certain actions
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin can manage users but not other admins or super admins
    if (currentUser.role === UserRole.ADMIN) {
      return targetUser.role === UserRole.USER;
    }

    return false;
  }

  async getUserPermissions(userRole: UserRole) {
    const permissions = this.rolePermissionsService.getUserPermissions(userRole);
    return {
      role: userRole,
      permissions
    };
  }

  async getRoleInfo(userRole: UserRole) {
    const permissions = this.rolePermissionsService.getUserPermissions(userRole);
    return {
      role: userRole,
      permissions,
      canManageUsers: this.rolePermissionsService.canManageUser(userRole, UserRole.USER),
      canAssignRoles: this.rolePermissionsService.canAssignRole(userRole, UserRole.USER),
    };
  }

  // Development only - Create Super Admin
  async createSuperAdmin(data: CreateSuperAdminDto) {
    // Check if super admin already exists
    const existingSuperAdmin = await this.userRepo.findOne({ role: UserRole.SUPER_ADMIN });
    if (existingSuperAdmin) {
      throw new BadRequestException('Super Admin already exists');
    }

    // Check if email already exists
    const existingUser = await this.userRepo.findOne({ email: data.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: Gender.Male,
      role: UserRole.SUPER_ADMIN,
      nationality: 'Bangladesh',
      religion: 'Islam',
      acceptTerms: true,
      avatarUrl: '/default-user.svg',
      passwordHash,
    });

    await this.userRepo.getEntityManager().persistAndFlush(user);
    const token = await this.signPayload({
      sub: String(user.id),
      email: user.email,
      role: user.role
    });

    return {
      user: this.sanitize(user),
      access_token: token,
      message: 'Super Admin created successfully'
    };
  }

  // Admin creates user with role assignment
  async createUser(data: CreateUserDto, createdByUserId: string) {
    // Check if email already exists
    const existingEmail = await this.userRepo.findOne({ email: data.email });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Check if phone already exists
    if (data.phone) {
      const existingPhone = await this.userRepo.findOne({ phone: data.phone });
      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender || Gender.Male,
      role: data.role || UserRole.USER,
      dob: (data.dob && data.dob.trim() !== '') ? new Date(data.dob) : undefined,
      nationality: data.nationality || 'Bangladesh',
      religion: data.religion || 'Islam',
      acceptTerms: true,
      avatarUrl: '/default-user.svg',
      passwordHash,
    });

    await this.userRepo.getEntityManager().persistAndFlush(user);

    return {
      user: this.sanitize(user),
      message: 'User created successfully'
    };
  }

  // Admin Management Methods
  async getAllAdmins(params: { search?: string; page: number; limit: number }) {
    const { search, page, limit } = params;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      role: UserRole.ADMIN
    };

    if (search) {
      whereClause.$or = [
        { firstName: { $ilike: `%${search}%` } },
        { lastName: { $ilike: `%${search}%` } },
        { email: { $ilike: `%${search}%` } }
      ];
    }

    const [admins, total] = await this.userRepo.findAndCount(whereClause, {
      limit,
      offset,
      orderBy: { createdAt: 'DESC' }
    });

    return {
      admins: admins.map(admin => this.sanitize(admin)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async promoteToAdmin(userId: string, currentUser: any) {
    const user = await this.userRepo.findOne({ id: parseInt(userId) });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('User is already an admin');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot modify Super Admin role');
    }

    user.role = UserRole.ADMIN;
    await this.userRepo.getEntityManager().persistAndFlush(user);

    return {
      user: this.sanitize(user),
      message: 'User promoted to admin successfully'
    };
  }

  async demoteAdmin(userId: string, currentUser: any) {
    const user = await this.userRepo.findOne({ id: parseInt(userId) });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot demote Super Admin');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException('User is not an admin');
    }

    // Prevent self-demotion
    if (user.id === parseInt(currentUser.userId)) {
      throw new BadRequestException('Cannot demote yourself');
    }

    user.role = UserRole.USER;
    await this.userRepo.getEntityManager().persistAndFlush(user);

    return {
      user: this.sanitize(user),
      message: 'Admin demoted to user successfully'
    };
  }
}
