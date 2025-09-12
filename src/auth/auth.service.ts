import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { User } from './entity/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpCode } from './entity/otp.entity';
import * as nodemailer from 'nodemailer';
import { Gender, UserRole, Permission } from '../utils/enums';
import * as bcrypt from 'bcryptjs';
import { RolePermissionsService } from './role-permissions.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    @InjectRepository(OtpCode) private readonly otpRepo: EntityRepository<OtpCode>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async signPayload<T extends object>(payload: T): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async signup(data: SignupDto) {
    if (!data.acceptTerms) {
      throw new BadRequestException('You must accept terms and conditions');
    }

    const uniqueChecks: any[] = [{ email: data.email }, { phone: data.phone }];
    const existing = await this.userRepo.findOne({ $or: uniqueChecks });
    if (existing) { 
      throw new BadRequestException('Email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender as Gender | Gender.Male,
      role: UserRole.USER, // Default role for new users
      dob: data.dob ? new Date(data.dob) : undefined,
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
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
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
      const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE || undefined,
        host: process.env.MAIL_HOST || undefined,
        port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined,
        secure: (process.env.MAIL_SECURE || 'false') === 'true',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      } as any);
      
      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new BadRequestException('Failed to send OTP email. Please try again.');
    }
  }


  private sanitize(user: User) {
    const { passwordHash, ...rest } = user as any;
    return rest;
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
    if (typeof data.dob !== 'undefined') user.dob = data.dob ? new Date(data.dob) : undefined;
    if (typeof data.nationality !== 'undefined') user.nationality = data.nationality as any;
    if (typeof data.religion !== 'undefined') user.religion = data.religion as any;
    if (typeof data.avatarUrl !== 'undefined') user.avatarUrl = data.avatarUrl as any;

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
      'Password Reset OTP', 
      `<p>Your password reset OTP is <b>${code}</b>. It expires in 5 minutes.</p><p>If you didn't request this, please ignore this email.</p>`
    );
    
    return { message: 'Password reset OTP sent successfully to your email' };
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
  async getAllUsers() {
    const users = await this.userRepo.findAll();
    return { users: users.map(user => this.sanitize(user)) };
  }

  async updateUserRole(userId: string, newRole: UserRole) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.role = newRole;
    await this.userRepo.getEntityManager().persistAndFlush(user);
    return { user: this.sanitize(user) };
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
}
