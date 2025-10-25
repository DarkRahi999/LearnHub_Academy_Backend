import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';
import { ExamCourse } from './course.entity';
import { Group } from './group.entity';
import { Subject } from './subject.entity';

@Entity({ tableName: 'chapter' })
export class Chapter extends Table {
  @Property({ length: 128 })
  name: string;

  @ManyToOne(() => ExamCourse)
  course: ExamCourse;

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => Subject)
  subject: Subject;

  @Property({ type: 'text', nullable: true })
  description?: string;
}