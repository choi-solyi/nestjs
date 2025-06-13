import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  // id_52,likeCount_20
  cursor?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  // ["likeCount_DESC", "id_ASD"]
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  take: number = 3;
}
