import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';
import { SubChapter } from './subchapter.entity';

@Entity({ tableName: 'question' })
export class Question extends Table {
  @Property({ length: 128 })
  name: string;

  @ManyToOne(() => SubChapter)
  subChapter: SubChapter;

  @Property({ type: 'text' })
  questionText: string;

  @Property({ type: 'text' })
  optionA: string;

  @Property({ type: 'text' })
  optionB: string;

  @Property({ type: 'text' })
  optionC: string;

  @Property({ type: 'text' })
  optionD: string;

  @Property({ length: 1 })
  correctAnswer: string; // A || B || C || D

  @Property({ type: 'text', nullable: true })
  description?: string;
}