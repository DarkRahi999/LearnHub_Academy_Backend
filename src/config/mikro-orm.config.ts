import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from '../auth/entity/user.entity';
import { OtpCode } from '../auth/entity/otp.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  entities: [User, OtpCode],
  debug: true,
  allowGlobalContext: true,
  driverOptions: {
    //  connection: {
    //  ssl: {
    //    rejectUnauthorized: false,
    //  },
    //  },
  },
});
