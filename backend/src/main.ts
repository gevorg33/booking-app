import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (!origin || allowed.includes(origin) || allowed.includes('*')) {
        callback(null, true);
        return;
      }
      // Allow tenant subdomains in dev/production, e.g. gloss.localhost:3000
      const rootDomain = process.env.ROOT_DOMAIN || 'localhost:3000';
      if (origin.endsWith(`.${rootDomain}`) || origin === `http://${rootDomain}` || origin === `https://${rootDomain}`) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
