import * as dotenv from 'dotenv';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from '../auth/entity/user.entity';
import { OtpCode } from '../auth/entity/otp.entity';
import { Notice } from '../notice/notice.entity';
import { NoticeRead } from '../notice/notice-read.entity';
import { Post } from '../post/post.entity';

dotenv.config();

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  entities: [User, OtpCode, Notice, NoticeRead, Post],
  debug: false,
  allowGlobalContext: true,
  driverOptions: {
    //  connection: {
    //  ssl: {
    //    rejectUnauthorized: false,
    //  },
    //  },
  },
});
