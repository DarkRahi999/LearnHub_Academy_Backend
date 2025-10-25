import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';
import { ExamCourse } from './course.entity';
import { Group } from './group.entity';

@Entity({ tableName: 'subject' })
export class Subject extends Table {
  @Property({ length: 128 })
  name: string;

  @ManyToOne(() => ExamCourse)
  course: ExamCourse;

  @ManyToOne(() => Group)
  group: Group;

  @Property({ type: 'text', nullable: true })
  description?: string;
}