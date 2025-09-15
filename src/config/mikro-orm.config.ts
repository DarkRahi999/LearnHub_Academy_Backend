import * as dotenv from 'dotenv';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from '../auth/entity/user.entity';
import { OtpCode } from '../auth/entity/otp.entity';
import { Notice } from '../notice/notice.entity';
import { NoticeRead } from '../notice/notice-read.entity';
import { Post } from '../post/post.entity';
import { SystemSetting } from '../system-settings/entity/system-setting.entity';

dotenv.config();

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  entities: [User, OtpCode, Notice, NoticeRead, Post, SystemSetting],
  debug: false,
  allowGlobalContext: true,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  driverOptions: {
    connection: {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    },
  },
});
