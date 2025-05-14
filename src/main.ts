import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);

    // Enable validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    // Enable CORS
    app.enableCors();

    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}
bootstrap();
