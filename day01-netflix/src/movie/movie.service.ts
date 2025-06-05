import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createQueryBuilder, In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

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
  ) {}

  async findAll(title?: string) {
    // [QueryBuilder]
    const query = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title)
      query.where('movie.title LIKE :title', {
        title: `%${title}%`,
      });

    return await query.getMany();

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

  async create(createMovieDto: CreateMovieDto) {
    //  [TypeORM]

    // const movieDetail = await this.movieDetailRepository.save({
    //   detail: createMovieDto.detail,
    // });

    const director = await this.directorRepository.findOne({
      where: { id: createMovieDto.directorId },
    });

    if (!director) throw new NotFoundException('존재하지 않는 감독 ID입니다.');

    const genres = await this.genreRepository.find({
      where: { id: In(createMovieDto.genreIds) },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new BadRequestException(
        `존재하지 않는 장르 ID가 있습니다 ${genres.map((g) => g.id).join(',')}`,
      );
    }

    // [QueryBuilder]
    const movieDetail = await this.movieDetailRepository
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({ detail: createMovieDto.detail })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id as number;

    const movie = await this.movieRepository
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
    // cascade 생성 불가
    // ManyToMany 관계는 별도로 처리해야 함

    await this.movieRepository
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((g) => g.id));

    return this.movieRepository.findOne({
      where: { id: movieId },
      relations: ['detail', 'director', 'genres'],
    });

    //  [TypeORM]
    // const movie = await this.movieRepository.save({
    //   title: createMovieDto.title,
    //   detail: movieDetail,
    //   director: director,
    //   genres,
    // });

    // return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'genres'],
    });

    if (!movie) throw new NotFoundException('존재하지 않는 ID입니다.');

    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    let newDirector: Director | undefined;

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: { id: directorId },
      });

      if (!director)
        throw new NotFoundException('존재하지 않는 감독 ID입니다.');
      newDirector = director;
    }

    let newGenres: Genre[] = movie.genres ?? [];

    if (genreIds && genreIds.length > 0) {
      const genres = await this.genreRepository.find({
        where: { id: In(genreIds) },
      });

      newGenres = genres;
    }

    const movieUpdateFields: Partial<Movie> = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    // [QueryBuilder]
    await this.movieRepository
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();

    //  [TypeORM]
    // await this.movieRepository.update({ id }, movieUpdateFields);

    if (detail) {
      // [QueryBuilder]
      await this.movieDetailRepository
        .createQueryBuilder()
        .update(MovieDetail)
        .set({ detail })
        .where('id = :id', { id: movie.detail.id })
        .execute();

      //  [TypeORM]
      // await this.movieDetailRepository.update(
      //   { id: movie.detail.id },
      //   { detail },
      // );
    }

    // [QueryBuilder]
    if (newGenres.length > 0) {
      await this.movieRepository
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        .addAndRemove(
          newGenres.map((g) => g.id), // 추가
          movie.genres.map((g) => g.id), // 제거
        );
    }

    //  [TypeORM]
    // const newMovie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director', 'genres'],
    // });

    // if (newMovie) {
    //   newMovie.genres = newGenres;
    //   await this.movieRepository.save(newMovie);
    // }

    return this.movieRepository.findOne({
      where: { id },
      relations: ['detail', 'director', 'genres'],
    });
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
