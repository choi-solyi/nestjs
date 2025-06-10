import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateMovieDto } from './create-movie.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  // @IsOptional()
  // @IsNotEmpty()
  // @IsString()
  // title?: string;
  // @IsOptional()
  // @IsNotEmpty()
  // @IsString()
  // detail?: string;
  // @IsOptional()
  // @IsNotEmpty()
  // @IsNumber()
  // directorId?: number;
  // @IsOptional()
  // @IsArray()
  // @ArrayNotEmpty()
  // @IsNumber({}, { each: true })
  // genreIds: number[];
}
