import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [MovieModule],
  // exports: [AppService],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
