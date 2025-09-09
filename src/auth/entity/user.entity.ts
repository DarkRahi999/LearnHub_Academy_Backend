import { Entity, PrimaryKey, Property, Unique, OptionalProps, Enum } from '@mikro-orm/core';
import { Gender } from '../../utils/enums';

@Entity()
export class User {
  [OptionalProps]?: 'createdAt' | 'updatedAt';
  @PrimaryKey()
  id!: number;

  @Property({ length: 64, unique: true })
  @Unique()
  email!: string;

  @Property({ length: 64, unique: true })
  @Unique()
  userName!: string;

  @Property({ length: 32 })
  firstName!: string;

  @Property({ length: 32, nullable: true })
  lastName?: string;

  @Enum({ items: () => Gender })
  gender!: Gender;

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


