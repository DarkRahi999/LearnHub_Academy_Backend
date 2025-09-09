import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');
  
  // Validation body inputs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation for my project')
    .setVersion('1.0')
    .addBearerAuth() // Enable bearer authentication
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 8001);

  console.log(`Application is running on: http://localhost:${process.env.PORT || 8001}`);
  console.log(`Application API Docs: http://localhost:${process.env.PORT || 8001}/api-docs`)

  // const dbUrl = process.env.DATABASE_URL || '';
  // const safeUrl = dbUrl.replace(/:(.*)@/, ':*****@');
  // console.log('Connecting to DB:', safeUrl);
}

bootstrap();
