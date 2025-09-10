import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'auth_otps' })
export class OtpCode {
  @PrimaryKey()
  id!: number;

  @Index()
  @Property({ length: 128 })
  email!: string;

  @Property({ length: 8 })
  code!: string;

  @Property()
  expiresAt!: Date;

  @Property({ default: 0 })
  attempts!: number;

  @Property({ default: false })
  consumed!: boolean;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();
}


