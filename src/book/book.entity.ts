import { Entity, PrimaryKey, Property, OptionalProps, ManyToOne, Check, Index } from '@mikro-orm/core';
import { User } from '../auth/entity/user.entity';

@Entity({ tableName: 'books' })
@Check({ expression: 'LENGTH(title) >= 5 AND LENGTH(title) <= 200', name: 'books_title_length_check' })
@Check({ expression: 'LENGTH(description) >= 10', name: 'books_description_length_check' })
@Check({ expression: 'LENGTH(highlight) >= 5 AND LENGTH(highlight) <= 300', name: 'books_highlight_length_check' })
export class Book {
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

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price!: number;

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