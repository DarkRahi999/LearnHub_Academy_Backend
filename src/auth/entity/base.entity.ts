import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class Table extends BaseEntity {
    @PrimaryKey()
    id!: number;

    @Property({ defaultRaw: 'now()' })
    createdAt: Date = new Date();

    @Property({
        defaultRaw: 'now()',
        onUpdate: () => 'now()',
        onCreate: () => new Date(),
    })
    updatedAt: Date = new Date();
}

@Entity({ tableName: 'setting' })
export class Setting extends Table {
    @Property({ unique: true, length: 128 })
    key: string;

    @Property({ type: 'text', nullable: true })
    value?: string;

    @Property({ type: 'text', nullable: true })
    oldValue?: string;
}