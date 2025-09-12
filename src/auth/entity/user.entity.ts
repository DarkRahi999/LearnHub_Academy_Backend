import { Entity, PrimaryKey, Property, Unique, OptionalProps, Enum } from '@mikro-orm/core';
import { Gender, UserRole } from '../../utils/enums';

@Entity({ tableName: 'users' })
export class User {
  [OptionalProps]?: 'createdAt' | 'updatedAt';
  @PrimaryKey()
  id!: number;

  @Property({ length: 64, unique: true })
  @Unique()
  email!: string;
  
  @Property({ length: 16, unique: true })
  @Unique()
  phone!: string;

  @Property({ length: 32 })
  firstName!: string;

  @Property({ length: 32, nullable: true })
  lastName?: string;

  @Enum({ items: () => Gender })
  gender!: Gender;

  @Enum({ items: () => UserRole, default: UserRole.USER })
  role!: UserRole;

  @Property({ type: Date, nullable: true })
  dob?: Date;

  @Property({ nullable: true })
  nationality?: string;

  @Property({ nullable: true })
  religion?: string;

  @Property({ default: false })
  acceptTerms!: boolean;

  @Property()
  avatarUrl!: string;

  @Property()
  passwordHash!: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}


