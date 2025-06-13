import { IsIn, IsInt, IsOptional } from 'class-validator';

export class CursorPaginationDto {
  @IsInt()
  @IsOptional()
  id: number;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @IsInt()
  @IsOptional()
  take: number = 20;
}
