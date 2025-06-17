import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('common')
export class CommonController {
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 20000000,
      },
      fileFilter(req, file, callback) {
        console.log(file);

        if (file.mimetype !== 'video/mp4')
          return callback(
            new BadRequestException('mp4 포맷만 업로드 하실 수 있습니다.'),
            false,
          );
        return callback(null, true);
      },
    }),
  )
  createVideo(@UploadedFile() movie: Express.Multer.File) {
    return {
      fileName: movie.filename,
    };
  }
}
