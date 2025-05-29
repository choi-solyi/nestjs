import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 필터링. DTO에 정의되지 않은 불필요한 속성들을 자동으로 제거
      forbidNonWhitelisted: true, // 거부. 위에서 제거만 하는 대신, 아예 에러를 던짐.
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
