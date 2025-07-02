import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  // id_52,likeCount_20
  @ApiProperty({
    description: '페이지네이션 커서',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjZ9LCJvcmRlciI6WyJpZF9ERVNDIl19',
  })
  cursor?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: '정렬',
    example: ['id_DESC'],
  })
  // Swagger 배열 보정
  @Transform((value) => {
    Array.isArray(value) ? value : [value];
  })
  // ["likeCount_DESC", "id_ASD"]
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터 갯수',
    example: '5',
  })
  take: number = 3;
}
