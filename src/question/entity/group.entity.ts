import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';
import { ExamCourse } from './course.entity';

@Entity({ tableName: 'group' })
export class Group extends Table {
  @Property({ length: 128 })
  name: string;

  @ManyToOne(() => ExamCourse)
  course: ExamCourse;

  @Property({ type: 'text', nullable: true })
  description?: string;
}