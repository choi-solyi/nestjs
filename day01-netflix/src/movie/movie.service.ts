import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createQueryBuilder,
  DataSource,
  In,
  Like,
  QueryRunner,
  Repository,
} from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly likeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto, userId?: number) {
    // Page based pagination 일때
    // const { title, take, page } = dto; // Page based pagination 일때

    const { title } = dto;
    const query = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title)
      query.where('movie.title Like :title', {
        title: `%${title}%`,
      });

    // Page based pagination 일때
    // if (take && page) {
    //   this.commonService.applyPagePaginationParamsToQb(query, { take, page });
    // }

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(query, dto);

    let [data, count] = await query.getManyAndCount();

    if (userId) {
      const movieIds = data.map((movie) => movie.id);
      const likedMovies =
        movieIds.length === 0
          ? []
          : await this.likeRepository
              .createQueryBuilder('mul')
              .leftJoinAndSelect('mul.user', 'user')
              .leftJoinAndSelect('mul.movie', 'movie')
              .where('movie.id IN(:...movieIds)', { movieIds })
              .andWhere('user.id = :userId', { userId })
              .getMany();

      /**
       * {
       *  movieId: boolean
       * }
       */
      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      data = data.map((x) => ({
        ...x,
        likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      }));
    }
    return {
      data,
      nextCursor,
      count,
    };

    this.commonService.applyCursorPaginationParamsToQb(query, dto);
    // return await query.getManyAndCount();

    // [QueryBuilder]
    // const query = this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');

    // if (title)
    //   query.where('movie.title LIKE :title', {
    //     title: `%${title}%`,
    //   });

    // return await query.getMany();

    //  [TypeORM]
    // if (!title)
    //   return [
    //     await this.movieRepository.find({ relations: ['director', 'genres'] }),
    //     await this.movieRepository.count(),
    //   ];

    // const movies = await this.movieRepository.findAndCount({
    //   where: { title: Like(`%${title}%`) },
    //   relations: ['director', 'genres'],
    // });

    // return movies;
  }

  async findOne(id: number) {
    // [QueryBuilder]
    const query = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();

    return await query;

    //  [TypeORM]
    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });
    // return movie;
  }

  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const director = await qr.manager.findOne(Director, {
      where: { id: createMovieDto.directorId },
    });

    if (!director) throw new NotFoundException('존재하지 않는 감독 ID입니다.');

    const genres = await qr.manager.find(Genre, {
      where: { id: In(createMovieDto.genreIds) },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new BadRequestException(
        `존재하지 않는 장르 ID가 있습니다 ${genres.map((g) => g.id).join(',')}`,
      );
    }

    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({ detail: createMovieDto.detail })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id as number;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId }, // MovieDetail의 id를 참조
        director: director,
        creator: { id: userId },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();

    const movieId = movie.identifiers[0].id as number;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((g) => g.id));

    // transaction 중간에 문제가 생길 수도 있으니 return 직전에서 파일을 옮긴다
    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName),
    );

    return qr.manager.findOne(Movie, {
      where: { id: movieId },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'genres'],
      });

      if (!movie) throw new NotFoundException('존재하지 않는 ID입니다.');

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector: Director | undefined;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });

        if (!director)
          throw new NotFoundException('존재하지 않는 감독 ID입니다.');
        newDirector = director;
      }

      let newGenres: Genre[] = movie.genres ?? [];

      if (genreIds && genreIds.length > 0) {
        const genres = await qr.manager.find(Genre, {
          where: { id: In(genreIds) },
        });

        newGenres = genres;
      }

      const movieUpdateFields: Partial<Movie> = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      // [QueryBuilder]
      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      if (detail) {
        // [QueryBuilder]
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }

      // [QueryBuilder]
      if (newGenres.length > 0) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            newGenres.map((g) => g.id), // 추가
            movie.genres.map((g) => g.id), // 제거
          );
      }
      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async remove(id: number) {
    // [QueryBuilder]

    //  [TypeORM]

    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });

    if (!movie) throw new NotFoundException('존재하지 않는 ID입니다.');

    // [QueryBuilder]
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    //  [TypeORM]
    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
    });

    if (!movie) throw new BadRequestException('존재하지 않는 영화입니다.');

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) throw new BadRequestException('존재하지 않는 사용자입니다.');

    const likeRecord = await this.likeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.likeRepository.delete({
          movie,
          user,
        });
      } else {
        await this.likeRepository.update(
          {
            movie,
            user,
          },
          {
            isLike,
          },
        );
      }
    } else {
      await this.likeRepository.save({
        movie,
        user,
        isLike,
      });
    }

    const result = await this.likeRepository
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .where('user.id = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike,
    };
  }
}
