import { Entity, PrimaryKey, Property, Unique, OptionalProps, Enum } from '@mikro-orm/core';
import { Gender, UserRole } from '../../utils/enums';

@Entity({ tableName: 'users' })
export class User {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'isBlocked' | 'lastLoginAt';
  @PrimaryKey()
  id!: number;

  @Property({ length: 64 })
  @Unique()
  email!: string;
  
  @Property({ length: 16, nullable: true })
  @Unique()
  phone?: string;

  @Property({ length: 32, nullable: true })
  firstName?: string;

  @Property({ length: 32, nullable: true })
  lastName?: string;

  @Enum({ items: () => Gender, nullable: true })
  gender?: Gender;

  @Enum({ items: () => UserRole, default: UserRole.USER })
  role!: UserRole;

  @Property({ type: Date, nullable: true })
  dob?: Date;

  @Property({ nullable: true })
  nationality?: string;

  @Property({ nullable: true })
  religion?: string;

  @Property({ default: false })
  acceptTerms?: boolean;

  @Property({ nullable: true, default: '/default-user.svg' })
  avatarUrl?: string;

  @Property({ nullable: false })
  passwordHash!: string;

  @Property({ default: false })
  isBlocked?: boolean;

  @Property({ type: Date, nullable: true })
  lastLoginAt?: Date;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

