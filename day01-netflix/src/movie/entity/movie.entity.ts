import { Exclude, Expose, Transform } from 'class-transformer';

// @Exclude()
export class Movie {
  id: number;
  @Expose() // 노출해도되는값
  title: string;

  // @Transform(({ value }) => 'solyi')
  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;

  // @Expose() // 노출해도되는값
  // get description() {
  //   return '' + this.title + '는 장르가 ' + this.genre + '인 영화입니다.';
  // }
}

// Movie 엔터티가 보안에 예민한 경우 전체를 @Exclude()로 감싸고,
// 노출하고 싶은 필드에 @Expose()를 붙여서 노출시킬 수 있다.
