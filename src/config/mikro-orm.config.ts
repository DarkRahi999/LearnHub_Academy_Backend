import * as dotenv from 'dotenv';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from '../auth/entity/user.entity';
import { OtpCode } from '../auth/entity/otp.entity';
import { Notice } from '../notice/notice.entity';
import { NoticeRead } from '../notice/notice-read.entity';
import { SystemSetting } from '../system-settings/entity/system-setting.entity';
import { Course } from '../course/course.entity';
import { Book } from '../book/book.entity';
import { Setting } from '../auth/entity/base.entity';
import { ExamCourse } from '../question/entity/course.entity';
import { Group } from '../question/entity/group.entity';
import { Chapter } from '../question/entity/chapter.entity';
import { SubChapter } from '../question/entity/subchapter.entity';
import { Question } from '../question/entity/question.entity';
import { Subject } from '../question/entity/subject.entity';
import { Exam } from '../exam/entity/exam.entity';
import { ExamResult } from '../exam/entity/exam-result.entity';

dotenv.config();

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  entities: [User, Setting, OtpCode, Notice, NoticeRead, SystemSetting, Course, Book, ExamCourse, Group, Subject, Chapter, SubChapter, Question, Exam, ExamResult],
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
      ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech') 
        ? { rejectUnauthorized: false } 
        : false,
    },
  },
});