import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for mobile & web access
  app.enableCors();
  
  // Global prefix for API endpoints (optional)
  // app.setGlobalPrefix('api');
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 BuildMart Server running on: http://localhost:${port}`);
}
bootstrap();
