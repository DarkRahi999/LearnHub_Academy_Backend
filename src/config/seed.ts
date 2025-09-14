import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import { User } from '../auth/entity/user.entity';
import { UserRole } from '../utils/enums';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple seeding script for development
export async function runSeeding() {
  console.log('🌱 Starting database seeding...');
  
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
    
    // Update schema
    console.log('🔧 Updating database schema...');
    await orm.getSchemaGenerator().updateSchema();
    console.log('✅ Database schema updated');
    
    const em = orm.em.fork();
    
    // Seed Super Admin
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
    
    // Seed Regular Admin
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
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Default Users Created:');
    console.log('👤 Super Admin - Email: superadmin@example.com, Password: SuperAdmin123!');
    console.log('👤 Admin - Email: admin@example.com, Password: Admin123!');
    
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
  runSeeding()
    .then(() => {
      console.log('✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}