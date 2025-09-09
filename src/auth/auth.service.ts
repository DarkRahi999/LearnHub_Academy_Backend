import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { User } from './entity/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Gender } from '../utils/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
  ) { }

  async signPayload<T extends object>(payload: T): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async signup(data: SignupDto) {
    if (!data.acceptTerms) {
      throw new BadRequestException('You must accept terms and conditions');
    }

    const existing = await this.userRepo.findOne({ $or: [{ email: data.email }, { userName: data.userName }] });
    if (existing) {
      throw new BadRequestException('Email or username already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      email: data.email,
      userName: data.userName,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender as Gender | Gender.Male,
      dob: data.dob ? new Date(data.dob) : undefined,
      nationality: data.nationality,
      religion: data.religion,
      acceptTerms: data.acceptTerms,
      avatarUrl: data.avatarUrl,
      passwordHash,
    });
    await this.userRepo.getEntityManager().persistAndFlush(user);
    const token = await this.signPayload({ sub: String(user.id) });
    return { user: this.sanitize(user), access_token: token };
  }

  async login(data: LoginDto) {
    const user = await this.userRepo.findOne(
      data.email ? { email: data.email } : { userName: data.userName ?? '' },
    );
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
}
