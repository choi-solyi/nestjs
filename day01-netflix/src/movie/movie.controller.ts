import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  BadRequestException,
  Request,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  ParseBoolPipe,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
// import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterCeptor } from 'src/common/interceptor/transaction.intercetptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import {
  CacheKey,
  CacheTTL,
  CacheInterceptor as CI,
} from '@nestjs/cache-manager';
@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
// @UseInterceptors(CacheInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  @UseInterceptors(CI) // CacheInterceptor를 쓰면 console이 찍히지 않음.
  @CacheKey('getMoviesRecent')
  @CacheTTL(3000)
  getMoviesRecent() {
    console.log('getMovieRecent 실행');
    return this.movieService.findRecent();
  }

  @Get(':id')
  @Public()
  getMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory(error) {
          throw new BadRequestException('숫자를 입력해주세요', error);
        },
      }),
    )
    id: number,
  ) {
    return this.movieService.findOne(+id);
  }

  /// 파일 1개 업로드
  // @Post()
  // @UseGuards(AuthGuard)
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterCeptor)
  // @UseInterceptors(FileInterceptor('movie')) // 파일 1개
  // postMovie(
  //   @Body() body: CreateMovieDto,
  //   @Request() req,
  //   @UploadedFile() file: Express.Multer.File, // 파일 1개
  // ) {
  //   console.log(file);
  //   return this.movieService.create(body, req.queryRunner);
  // }

  /// 파일 여러개 업로드
  // @Post()
  // @UseGuards(AuthGuard)
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterCeptor)
  // @UseInterceptors(FilesInterceptor('movies')) //  파일 여러개
  // postMovie(
  //   @Body() body: CreateMovieDto,
  //   @Request() req,
  //   @UploadedFiles() files: Express.Multer.File[], //  파일 여러개
  // ) {
  //   console.log(files);
  //   return this.movieService.create(body, req.queryRunner);
  // }

  /// 파일 필드 여러개 업로드
  // @Post()
  // @UseGuards(AuthGuard)
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterCeptor)
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'movie', maxCount: 1 },
  //       { name: 'poster', maxCount: 2 },
  //     ],
  //     {
  //       limits: {
  //         fileSize: 20000000,
  //       },
  //       fileFilter(req, file, callback) {
  //         console.log(file);

  //         if (file.mimetype !== 'video/mp4')
  //           return callback(
  //             new BadRequestException('mp4 포맷만 업로드 하실 수 있습니다.'),
  //             false,
  //           );
  //         return callback(null, true);
  //       },
  //     },
  //   ),
  // ) //  파일 필드 여러개
  // postMovie(
  //   @Body() body: CreateMovieDto,
  //   @Request() req,
  //   @UploadedFiles()
  //   files: {
  //     movie?: Express.Multer.File[];
  //   }, //  파일 필드 여러개
  // ) {
  //   console.log(files);
  //   return this.movieService.create(body, req.queryRunner);
  // }

  @Post()
  @UseGuards(AuthGuard)
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterCeptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId()
    userId: number,
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory(error) {
          throw new BadRequestException('숫자를 입력해주세요', error);
        },
      }),
    )
    id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory(error) {
          throw new BadRequestException('숫자를 입력해주세요', error);
        },
      }),
    )
    id: string,
  ) {
    return this.movieService.remove(+id);
  }

  /**
   * [Like] [Dislike]
   *
   * 아무것도 누르지 않은 상태
   * Like & Dislike 모두 버튼 꺼져 있음
   *
   * Like 버튼 누르면 Like 버튼 불켜짐
   * 다시 Like 버튼 누르면 불 꺼짐
   *
   * Dislike 버튼 누르면 Dislike 버튼 불켜짐
   * 다시 Dislike 버튼 누르면 불 꺼짐
   *
   * Like 버튼 누름 Like 버튼 불켜짐
   * -> Like 버튼 불 꺼지고 Dislike 버튼 불 켜짐
   *
   */

  @Post(':id/like')
  async createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return await this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  async createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return await this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
