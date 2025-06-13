import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';

// export class GetMoviesDto extends PagePaginationDto {
//   @IsOptional()
//   @IsString()
//   title?: string;
// }

export class GetMoviesDto extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  title?: string;
}
