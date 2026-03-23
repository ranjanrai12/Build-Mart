import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryColumn()
  id: string; // e.g., 'c1'

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ type: 'simple-array' })
  gradient: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
