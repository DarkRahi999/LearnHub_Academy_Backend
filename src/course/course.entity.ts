import { Entity, PrimaryKey, Property, OptionalProps, ManyToOne, Check, Index } from '@mikro-orm/core';
import { User } from '../auth/entity/user.entity';

@Entity({ tableName: 'courses' })
@Check({ expression: 'LENGTH(title) >= 5 AND LENGTH(title) <= 200', name: 'courses_title_length_check' })
@Check({ expression: 'LENGTH(description) >= 10', name: 'courses_description_length_check' })
@Check({ expression: 'LENGTH(highlight) >= 5 AND LENGTH(highlight) <= 300', name: 'courses_highlight_length_check' })
export class Course {
  [OptionalProps]?: 'createdAt' | 'editedAt';

  @PrimaryKey()
  id!: number;

  @Property({ length: 200, columnType: 'varchar(200)', nullable: false })
  @Index()
  title!: string;

  @Property({ type: 'text', nullable: false })
  description!: string;

  @Property({ length: 300, columnType: 'varchar(300)', nullable: false })
  highlight!: string;

  @Property({ type: 'text', nullable: true })
  imageUrl?: string;

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