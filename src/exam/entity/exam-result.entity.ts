import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';
import { User } from '../../auth/entity/user.entity';
import { Exam } from './exam.entity';

@Entity({ tableName: 'exam_results' })
export class ExamResult extends Table {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Exam)
  exam: Exam;

  @Property()
  score: number;

  @Property()
  totalQuestions: number;

  @Property()
  correctAnswers: number;

  @Property()
  percentage: number;

  @Property()
  passed: boolean;

  @Property({ type: 'json' })
  answers: { questionId: number; userAnswer: string; correctAnswer: string }[];

  @Property({ default: false })
  isPractice: boolean;
  
  // Add timestamp for better reporting
  @Property()
  submittedAt: Date = new Date();
}