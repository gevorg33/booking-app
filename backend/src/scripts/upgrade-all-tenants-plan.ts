import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module.js';
import { Business } from '../modules/business/entities/business.entity.js';
import { SubscriptionStatus } from '../modules/billing/subscription-status.enum.js';
import { TOP_SUBSCRIPTION_PLAN_ID } from '../modules/billing/plan-limits.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const businessRepo = app.get<Repository<Business>>(getRepositoryToken(Business));
    const businesses = await businessRepo.find({
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlanId: true,
        subscriptionStatus: true,
      },
    });

    console.log(`Found ${businesses.length} tenant(s).`);
    if (businesses.length === 0) {
      return;
    }

    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 10);

    for (const business of businesses) {
      console.log(
        `- ${business.name} (${business.slug}): ${business.subscriptionPlanId ?? 'none'} / ${business.subscriptionStatus}`,
      );
    }

    if (dryRun) {
      console.log(
        `\nDry run — would set all to plan "${TOP_SUBSCRIPTION_PLAN_ID}" with status "${SubscriptionStatus.ACTIVE}".`,
      );
      return;
    }

    const result = await businessRepo
      .createQueryBuilder()
      .update(Business)
      .set({
        subscriptionPlanId: TOP_SUBSCRIPTION_PLAN_ID,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionCurrentPeriodEnd: periodEnd,
      })
      .execute();

    console.log(`\nUpdated ${result.affected ?? 0} tenant(s) to ${TOP_SUBSCRIPTION_PLAN_ID} (active).`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
