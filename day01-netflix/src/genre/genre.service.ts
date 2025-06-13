import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}

  findAll() {
    return this.genreRepo.find({ relations: ['movies'] });
  }

  findOne(id: number) {
    return this.genreRepo.findOne({
      where: { id },
      relations: ['movies'],
    });
  }

  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.genreRepo.findOne({
      where: { name: createGenreDto.name },
    });

    if (genre) {
      throw new BadRequestException(
        `이미 존재하는 Genre입니다. [${createGenreDto.name}]`,
      );
    }

    return this.genreRepo.save(createGenreDto);
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepo.findOne({ where: { id } });

    if (!genre) {
      throw new NotFoundException('Genre not found');
    }

    await this.genreRepo.update(
      { id },
      {
        ...updateGenreDto,
      },
    );

    return await this.genreRepo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const genre = await this.genreRepo.findOne({ where: { id } });

    if (!genre) {
      throw new Error('Genre not found');
    }

    await this.genreRepo.remove(genre);

    return id;
  }
}
