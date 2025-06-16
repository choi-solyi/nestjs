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
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto) {
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

    const [data, count] = await query.getManyAndCount();

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

  async create(createMovieDto: CreateMovieDto, qr: QueryRunner) {
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

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId }, // MovieDetail의 id를 참조
        director: director,
      })
      .execute();

    const movieId = movie.identifiers[0].id as number;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((g) => g.id));

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
}
