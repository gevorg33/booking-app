import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AppAdoptionEventName =
  | 'app_installed'
  | 'app_opened'
  | 'signed_in'
  | 'viewed_salon'
  | 'started_booking'
  | 'completed_booking'
  | 'rebooked'
  | 'referral_sent'
  | 'referral_accepted'
  | 'referral_converted'
  | 'salon_shared'
  | 'booking_shared'
  | 'share_reward_claimed'
  | 'review_prompt_shown'
  | 'tenant_review_submitted'
  | 'store_review_opened'
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'booking_abandoned'
  | 'booking_resumed'
  | 'push_priming_shown'
  | 'push_priming_accepted'
  | 'push_priming_declined'
  | 'push_reachability_registered'
  | 'push_permission_upgraded'
  | 'push_settings_reask_shown'
  | 'push_provisional_upgrade_shown'
  | 'post_booking_sign_in_shown'
  | 'post_booking_sign_in_completed'
  | 'post_booking_sign_in_skipped'
  | 'activation_payment_fallback'
  | 'app_interactive'
  | 'staff_contacted_customer';

export type AppAdoptionPlatform = 'ios' | 'android' | 'web';

export type AppAdoptionSurface = 'consumer_app' | 'provider_app' | 'public_web';

export type AppAdoptionStartType = 'cold' | 'warm';

export type AppAdoptionUserType = 'first_open' | 'returning';

@Entity('app_event')
@Index('idx_app_event_business_event_created', ['businessId', 'event', 'createdAt'])
@Index('idx_app_event_platform', ['platform'])
@Index('idx_app_event_anon_id', ['anonId'])
@Index('idx_app_event_business_created', ['businessId', 'createdAt'])
export class AppEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ name: 'anon_id', type: 'varchar', length: 64 })
  anonId: string;

  @Column({ type: 'varchar', length: 64 })
  event: AppAdoptionEventName;

  @Column({ type: 'varchar', length: 16 })
  platform: AppAdoptionPlatform;

  @Column({ name: 'app_surface', type: 'varchar', length: 32 })
  appSurface: AppAdoptionSurface;

  @Column({ name: 'app_version', type: 'varchar', length: 32, nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 16, default: 'en' })
  locale: string;

  @Column({ name: 'tenant_slug', type: 'varchar', length: 128, nullable: true })
  tenantSlug: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 64, nullable: true })
  sessionId: string | null;

  @Column({ name: 'start_type', type: 'varchar', length: 16, nullable: true })
  startType: AppAdoptionStartType | null;

  @Column({ name: 'user_type', type: 'varchar', length: 16, nullable: true })
  userType: AppAdoptionUserType | null;

  @Column({ type: 'jsonb', nullable: true })
  props: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
