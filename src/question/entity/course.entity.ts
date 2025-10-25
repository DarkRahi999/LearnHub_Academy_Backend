import { Entity, Property } from '@mikro-orm/core';
import { Table } from '../../auth/entity/base.entity';

@Entity({ tableName: 'examCourse' })
export class ExamCourse extends Table {
  @Property({ length: 128 })
  name: string;

  @Property({ type: 'text', nullable: true })
  description?: string;
}