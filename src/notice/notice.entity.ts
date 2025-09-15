import { Entity, PrimaryKey, Property, OptionalProps, ManyToOne, Check, Index } from '@mikro-orm/core';
import { User } from '../auth/entity/user.entity';

@Entity({ tableName: 'notices' })
@Check({ expression: 'LENGTH(sub_heading) >= 5 AND LENGTH(sub_heading) <= 200', name: 'notices_sub_heading_length_check' })
@Check({ expression: 'LENGTH(description) >= 10', name: 'notices_description_length_check' })
export class Notice {
  [OptionalProps]?: 'createdAt' | 'editedAt';

  @PrimaryKey()
  id!: number;

  @Property({ length: 200, columnType: 'varchar(200)', nullable: false })
  @Index()
  subHeading!: string;

  @Property({ type: 'text', nullable: false })
  description!: string;

  @Property({ default: true, nullable: false })
  @Index()
  isActive!: boolean;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @Index()
  createdBy!: User;

  @Property({ onCreate: () => new Date(), nullable: false })
  @Index()
  createdAt: Date = new Date();

  @Property({ nullable: true, onUpdate: () => new Date() })
  editedAt?: Date;
}
