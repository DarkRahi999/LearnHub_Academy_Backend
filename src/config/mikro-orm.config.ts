import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from 'src/auth/entity/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,
  entities: [User],
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
