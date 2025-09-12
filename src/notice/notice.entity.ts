import { Entity, PrimaryKey, Property, OptionalProps, ManyToOne } from '@mikro-orm/core';
import { User } from '../auth/entity/user.entity';

@Entity({ tableName: 'notices' })
export class Notice {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey()
  id!: number;

  @Property({ length: 200 })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User)
  createdBy!: User;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
