import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false, // 모든 log가 보이지 않음
    // logger: ['error'], // 에러 레벨 부터 그 위에 해당되는 모든 로그가 보임
  });
  // app.setGlobalPrefix('v1');
  // app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 필터링. DTO에 정의되지 않은 불필요한 속성들을 자동으로 제거
      forbidNonWhitelisted: true, // 거부. 위에서 제거만 하는 대신, 아예 에러를 던짐.
      transformOptions: {
        enableImplicitConversion: true, // 타입을 기반으로 입력하는 값을 변경해줌 "자동으로"
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
