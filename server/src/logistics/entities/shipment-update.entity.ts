import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Shipment } from './shipment.entity';

@Entity('shipment_updates')
export class ShipmentUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shipmentId: string;

  @ManyToOne(() => Shipment)
  shipment: Shipment;

  @Column()
  status: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  message: string;

  @CreateDateColumn()
  timestamp: Date;
}
