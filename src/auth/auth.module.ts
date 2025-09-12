import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolePermissionsService } from './role-permissions.service';
import { JwtStrategy } from '../config/jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entity/user.entity';
import { OtpCode } from './entity/otp.entity';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forFeature([User, OtpCode]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'dev_jwt_secret',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RolePermissionsService, JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, PassportModule, AuthService, RolePermissionsService, JwtAuthGuard],
})
export class AuthModule { }
