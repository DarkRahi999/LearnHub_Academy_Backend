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
import { Gender } from '../utils/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    @InjectRepository(OtpCode) private readonly otpRepo: EntityRepository<OtpCode>,
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
      dob: data.dob ? new Date(data.dob) : undefined,
      nationality: data.nationality,
      religion: data.religion,
      acceptTerms: data.acceptTerms,
      avatarUrl: data.avatarUrl || 'https://via.placeholder.com/150',
      passwordHash,
    });
    await this.userRepo.getEntityManager().persistAndFlush(user);
    const token = await this.signPayload({ sub: String(user.id) });
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
    const token = await this.signPayload({ sub: String(user.id) });
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
          user: process.env.MAIL_USER || 'elevixorbd@gmail.com',
          pass: process.env.MAIL_PASS || '',
        },
      } as any);
      
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'elevixorbd@gmail.com',
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

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.userRepo.findOne({ id: Number(userId) });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.avatarUrl = avatarUrl;
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
}
