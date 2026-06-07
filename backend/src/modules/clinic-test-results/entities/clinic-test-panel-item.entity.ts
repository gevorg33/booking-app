import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClinicTestPanel } from './clinic-test-panel.entity.js';
import { ClinicTestType } from './clinic-test-type.entity.js';

@Entity('clinic_test_panel_items')
@Index(['panelId', 'testTypeId'], { unique: true })
export class ClinicTestPanelItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicTestPanel, (panel) => panel.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'panel_id' })
  panel: ClinicTestPanel;

  @Column({ name: 'panel_id' })
  panelId: string;

  @ManyToOne(() => ClinicTestType, (type) => type.panelItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_type_id' })
  testType: ClinicTestType;

  @Column({ name: 'test_type_id' })
  testTypeId: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
