import mikroOrmConfig from './mikro-orm.config';
import { User } from '../auth/entity/user.entity';
import { SystemSetting, SettingType, SettingCategory } from '../system-settings/entity/system-setting.entity';
import { UserRole } from '../utils/enums';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { MikroORM } from '@mikro-orm/postgresql';

// Load environment variables
dotenv.config();

// Simple seeding script for development
export async function runSeeding(refresh = true) {
  console.log(`🌱 Starting database ${refresh ? 'refresh' : 'sync'}...`);
  
  // Validate environment variables
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL environment variable is required');
  }
  
  console.log('🔗 Database URL:', process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@'));
  
  let orm: MikroORM | undefined;
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    orm = await MikroORM.init(mikroOrmConfig);
    console.log('✅ Database connection established');
    
    const em = orm.em.fork();
    
    if (refresh) {
      // Create schema (fresh installation) - drops all data
      console.log('🔧 Creating database schema (refresh mode)...');
      await orm.getSchemaGenerator().ensureDatabase();
      await orm.getSchemaGenerator().dropSchema();
      await orm.getSchemaGenerator().createSchema();
      console.log('✅ Database schema created');
    } else {
      // Update schema (sync mode) - preserves existing data
      console.log('🔄 Syncing database schema (sync mode)...');
      await orm.getSchemaGenerator().ensureDatabase();
      await orm.getSchemaGenerator().updateSchema();
      console.log('✅ Database schema synced');
    }
    
    // Seed Super Admin (only if not exists)
    let superAdmin = await em.findOne(User, { email: 'superadmin@example.com' });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
      
      superAdmin = em.create(User, {
        email: 'superadmin@example.com',
        phone: '01700000000',
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash: hashedPassword,
        acceptTerms: true,
      });
      
      await em.persistAndFlush(superAdmin);
      console.log('✅ Super Admin user created');
    } else {
      console.log('ℹ️ Super Admin user already exists');
    }
    
    // Seed Regular Admin (only if not exists)
    let admin = await em.findOne(User, { email: 'admin@example.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      admin = em.create(User, {
        email: 'admin@example.com',
        phone: '01700000001',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        passwordHash: hashedPassword,
        acceptTerms: true,
      });
      
      await em.persistAndFlush(admin);
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    // Seed System Settings (only if not exist)
    console.log('⚙️ Seeding system settings...');
    const defaultSettings = [
      {
        key: 'app_name',
        value: 'LearnHub Academy',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        name: 'Application Name',
        description: 'The name displayed across the application',
        isPublic: true,
        isEditable: true,
      },
      {
        key: 'app_description',
        value: 'A comprehensive learning management system',
        type: SettingType.STRING,
        category: SettingCategory.GENERAL,
        name: 'Application Description',
        description: 'Brief description of the application',
        isPublic: true,
        isEditable: true,
      },
      {
        key: 'max_login_attempts',
        value: '5',
        type: SettingType.NUMBER,
        category: SettingCategory.SECURITY,
        name: 'Maximum Login Attempts',
        description: 'Maximum number of failed login attempts before account lockout',
        isPublic: false,
        isEditable: true,
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        type: SettingType.BOOLEAN,
        category: SettingCategory.MAINTENANCE,
        name: 'Maintenance Mode',
        description: 'Enable/disable maintenance mode',
        isPublic: false,
        isEditable: true,
      },
      {
        key: 'email_notifications',
        value: 'true',
        type: SettingType.BOOLEAN,
        category: SettingCategory.EMAIL,
        name: 'Email Notifications',
        description: 'Enable/disable email notifications',
        isPublic: false,
        isEditable: true,
      },
    ];
    
    for (const settingData of defaultSettings) {
      const existingSetting = await em.findOne(SystemSetting, { key: settingData.key });
      if (!existingSetting) {
        const setting = em.create(SystemSetting, settingData);
        em.persist(setting);
        console.log(`✅ System setting created: ${settingData.key}`);
      } else {
        console.log(`ℹ️ System setting already exists: ${settingData.key}`);
      }
    }
    
    await em.flush();
    console.log('✅ System settings seeding completed');
    
    console.log(`🎉 Database ${refresh ? 'refresh' : 'sync'} completed successfully!`);
    if (refresh) {
      console.log('');
      console.log('📋 Default Users Created:');
      console.log('👤 Super Admin - Email: superadmin@example.com, Password: SuperAdmin123!');
      console.log('👤 Admin - Email: admin@example.com, Password: Admin123!');
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('📛 Database connection refused. Please ensure PostgreSQL is running.');
      } else if (error.message.includes('authentication failed')) {
        console.error('🔑 Database authentication failed. Check your credentials.');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('💾 Database does not exist. Please create the database first.');
      }
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  } finally {
    if (orm) {
      console.log('🔌 Closing database connection...');
      await orm.close();
      console.log('✅ Database connection closed');
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const syncMode = args.includes('--sync') || args.includes('-s');
  
  runSeeding(!syncMode) // Default to refresh mode, unless --sync flag is provided
    .then(() => {
      console.log(`✅ ${syncMode ? 'Sync' : 'Refresh'} script completed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`❌ ${syncMode ? 'Sync' : 'Refresh'} script failed:`, error);
      process.exit(1);
    });
}