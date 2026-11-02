import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', '/api');
  const corsOrigin = configService.get<string>('app.corsOrigin', 'http://localhost:5173');

  // CORS configuration
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global prefix: /api
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Centralized error filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`Virtual AI Company (VAC) API Backend Server running`);
  logger.log(`API URL:        http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
  logger.log(`Health Check:   http://localhost:${port}/${apiPrefix.replace(/^\//, '')}/health`);
  logger.log(`CORS Origin:    ${corsOrigin}`);
  logger.log(`Environment:    ${configService.get<string>('app.nodeEnv')}`);
  logger.log(`====================================================`);
}

bootstrap();
