import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: '영화의 제목',
    example: '해리포터',
  })
  title?: string;
}
