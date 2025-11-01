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
    
    // Seed System Settings (only if not exists)
    let systemSettings = await em.findOne(SystemSetting, { key: 'app_name' });
    if (!systemSettings) {
      const settings = [
        { 
          key: 'app_name', 
          value: 'LearnHub Academy', 
          oldValue: null, 
          type: SettingType.STRING, 
          category: SettingCategory.GENERAL,
          name: 'Application Name',
          isPublic: true,
          isEditable: true
        },
        { 
          key: 'app_description', 
          value: 'Online Learning Platform', 
          oldValue: null, 
          type: SettingType.STRING, 
          category: SettingCategory.GENERAL,
          name: 'Application Description',
          isPublic: true,
          isEditable: true
        },
        { 
          key: 'contact_email', 
          value: 'support@learnhub.com', 
          oldValue: null, 
          type: SettingType.STRING, 
          category: SettingCategory.GENERAL,
          name: 'Contact Email',
          isPublic: true,
          isEditable: true
        },
        { 
          key: 'contact_phone', 
          value: '+1234567890', 
          oldValue: null, 
          type: SettingType.STRING, 
          category: SettingCategory.GENERAL,
          name: 'Contact Phone',
          isPublic: true,
          isEditable: true
        },
      ];
      
      for (const settingData of settings) {
        const setting = em.create(SystemSetting, settingData);
        await em.persist(setting);
      }
      
      await em.flush();
      console.log('✅ System settings created');
    } else {
      console.log('ℹ️ System settings already exist');
    }
    
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    if (orm) {
      await orm.close();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  const refresh = process.argv.includes('--refresh');
  runSeeding(refresh).catch(console.error);
}