import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './config/mikro-orm.config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth';
import { NoticeModule } from './notice/notice.module';
import { PostModule } from './post/post.module';
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
    try {
      console.log('🚀 Initializing database schema...');
      await this.orm.getSchemaGenerator().updateSchema();
      console.log('✅ Database schema updated successfully');
    } catch (error) {
      console.error('❌ Error during database initialization:', error);
      throw error;
    }
  }
}
