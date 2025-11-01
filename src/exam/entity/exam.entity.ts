import { Entity, Property, ManyToMany, Collection } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';
import { Question } from '../../question/entity/question.entity';

@Entity({ tableName: 'exam' })
export class Exam extends Table {
  @Property({ length: 255 })
  name: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'date' })
  examDate: Date;

  @Property({ type: 'time' })
  startTime: string;

  @Property({ type: 'time' })
  endTime: string;

  @Property()
  duration: number; // in minutes

  @Property()
  totalQuestions: number;

  @ManyToMany(() => Question, undefined, { owner: true })
  questions = new Collection<Question>(this);

  @Property({ default: true })
  isActive: boolean;
}