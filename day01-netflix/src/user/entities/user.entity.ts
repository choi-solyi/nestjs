import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseTable } from 'src/common/entity/base.entity';
import { MovieUserLike } from 'src/movie/entity/movie-user-like.entity';
import { Movie } from 'src/movie/entity/movie.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({
    toClassOnly: false, // 요청을 받을때
    toPlainOnly: true, // 응답을 할때
  })
  @ApiHideProperty()
  password: string;

  @Column({ enum: Role, default: Role.user })
  role: Role;

  @OneToMany(() => Movie, (movie) => movie.creator)
  createdMovies: Movie[];

  @OneToMany(() => MovieUserLike, (mul) => mul.user)
  likedMovies: MovieUserLike[];
}
