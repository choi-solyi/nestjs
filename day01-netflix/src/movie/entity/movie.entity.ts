import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from './base.entity';
import { MovieDetail } from './movie-detail.entity';

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

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(
    () => MovieDetail, // 연결
    (movieDetail) => movieDetail.id, // MovieDetail의 id와 연결
    { cascade: true }, // cascade
  )
  @JoinColumn()
  detail: MovieDetail;
}
