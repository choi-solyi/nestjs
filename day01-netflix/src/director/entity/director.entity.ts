import { BaseTable } from 'src/common/entity/base.entity';
import { Movie } from 'src/movie/entity/movie.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'director' })
export class Director extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  dob: Date;

  @Column()
  nationality: string;

  // '내'가 먼저 == Director가 One
  @OneToMany(() => Movie, (movie) => movie.director)
  movies: Movie[];
}
