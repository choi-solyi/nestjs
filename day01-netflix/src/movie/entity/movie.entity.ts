import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MovieDetail } from './movie-detail.entity';
import { BaseTable } from 'src/common/entity/base.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

// ---- Entity Embedding 방식 ---- //
// base : { createdAt, ... }  이런식으로 반환됨
// export class BaseEntity {
//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;

//   @VersionColumn()
//   version: number;
// }

// @Entity()
// export class Movie {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   title: string;

//   @Column()
//   genre: string;

//   @Column(() => BaseEntity)
//   base: BaseEntity;
// }

// ---- Entity Inheritance 방식 ---- //

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @OneToOne(
    () => MovieDetail, // 연결
    (movieDetail) => movieDetail.id, // MovieDetail의 id와 연결
    { cascade: true }, // cascade
  )
  @JoinColumn()
  detail: MovieDetail;

  @ManyToOne(() => Director, (d) => d.id, { cascade: true, nullable: false })
  director: Director;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @Column({ default: 0 })
  likeCount: number;
}
