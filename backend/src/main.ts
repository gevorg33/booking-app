import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

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
      // Dev: allow Capacitor / Ionic WebView origins (native provider app)
      if (process.env.NODE_ENV !== 'production' && origin) {
        if (/^capacitor:\/\/|^ionic:\/\//.test(origin)) {
          callback(null, true);
          return;
        }
        if (
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
            origin,
          )
        ) {
          callback(null, true);
          return;
        }
      }
      // Allow tenant subdomains in dev/production, e.g. gloss.localhost:3000
      const rootDomain = process.env.ROOT_DOMAIN || 'localhost:3000';
      if (
        origin.endsWith(`.${rootDomain}`) ||
        origin === `http://${rootDomain}` ||
        origin === `https://${rootDomain}`
      ) {
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

  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  const lanHint =
    host === '0.0.0.0'
      ? ' (LAN: use your machine IP, e.g. http://192.168.x.x:' + port + ')'
      : '';
  console.log(`Server running on http://localhost:${port}${lanHint}`);
}

bootstrap();
