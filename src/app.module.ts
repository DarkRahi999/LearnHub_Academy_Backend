import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './config/mikro-orm.config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth';
import { NoticeModule } from './notice/notice.module';
import { PostModule } from './post/post.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { CourseModule } from './course/course.module';
import { MikroORM } from '@mikro-orm/core';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuthModule,
    NoticeModule,
    PostModule,
    SystemSettingsModule,
    CourseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) { }

  async onModuleInit() {
    // Skip database schema update to prevent hanging
  }
}