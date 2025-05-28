import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return [
      {
        id: 1,
        name: '해리포터',
        characters: ['해리포터', '헤르미온느', '론'],
      },
    ];
  }

  @Get(':id')
  getMovie() {
    return {
      id: 1,
      name: '해리포터',
      characters: ['해리포터', '헤르미온느', '론'],
    };
  }

  @Post()
  postMovie() {
    return {
      id: 3,
      name: '반지의 제왕',
      characters: ['프로도', '샘', '아라고른'],
    };
  }

  @Patch(':id')
  patchMovie() {
    return {
      id: 1,
      name: '해리포터',
      characters: ['해리포터', '헤르미온느', '론', '드레이코'],
    };
  }

  @Delete(':id')
  deleteMovie() {
    return 1;
  }
}
