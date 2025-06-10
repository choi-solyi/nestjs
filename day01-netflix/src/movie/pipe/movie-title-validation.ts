import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      return value;
    }
    if (value.length <= 2)
      throw new BadRequestException('영화 제목은 3자 이상이어야 합니다.');

    //{ metatype: [Function: String], type: 'query', data: 'title' }
    // console.log(metadata);
    return value;
  }
}
