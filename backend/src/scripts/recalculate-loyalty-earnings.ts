import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { LoyaltyAwardService } from '../modules/loyalty/loyalty-award.service.js';

async function main() {
  const businessId = process.argv[2];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const loyaltyAwardService = app.get(LoyaltyAwardService);
    console.log(`Recalculating loyalty earnings${businessId ? ` for tenant ${businessId}` : ' for all tenants'}...`);
    const summary = await loyaltyAwardService.recalculateExistingEarnings(businessId);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
