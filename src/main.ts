import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose']
    });
    
    // CORS configuration
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

    // Global validation pipe with enhanced error messages
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }));

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('Full Stack API')
      .setDescription('API documentation for Full Stack application')
      .setVersion('1.0')
      .addBearerAuth(
        { 
          type: 'http', 
          scheme: 'bearer', 
          bearerFormat: 'JWT', 
          name: 'Authorization', 
          in: 'header' 
        },
        'JWT-auth'
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    const port = process.env.PORT || 8001;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Log database connection (safely)
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl) {
      const safeUrl = dbUrl.replace(/:([^:@]+)@/, ':*****@');
      logger.log(`💾 Database: ${safeUrl}`);
    }
    
    // Development tip
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      logger.log(`🌱 To seed development data, run: npm run seed`);
    }
    
    logger.log(`✨ Application startup completed successfully!`);
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
