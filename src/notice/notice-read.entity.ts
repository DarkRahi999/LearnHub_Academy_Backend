import { Entity, PrimaryKey, ManyToOne, Property, Index, Unique } from '@mikro-orm/core';
import { User } from '../auth/entity/user.entity';
import { Notice } from './notice.entity';

@Entity({ tableName: 'notice_reads' })
@Unique({ properties: ['user', 'notice'] })
export class NoticeRead {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @Index()
  user!: User;

  @ManyToOne(() => Notice, { nullable: false })
  @Index()
  notice!: Notice;

  @Property({ onCreate: () => new Date(), nullable: false })
  readAt: Date = new Date();
}