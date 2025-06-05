import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  dob: Date;

  @IsNotEmpty()
  @IsString()
  nationality: string;
}
