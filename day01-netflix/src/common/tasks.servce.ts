import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DefaultLogger } from './logger/default.logger';
@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,

    private readonly schedulerRegistry: SchedulerRegistry,

    private readonly logger: DefaultLogger,
  ) {}

  // @Cron('* * * * * *')
  @Cron('*/5 * * * * *')
  logEverySecond() {
    // console.log('1초마다 실행');
    // logger의  중요도 순서
    console.log('------------------------------------');
    this.logger.fatal('FATAL 레벨 로그');
    this.logger.error('ERROR 레벨 로그');
    this.logger.warn('WARN 레벨 로그');
    this.logger.log('LOG 레벨 로그');
    this.logger.debug('DEBUG 레벨 로그');
    this.logger.verbose('VERBOSE 레벨 로그');
  }

  /// 잉여 파일 삭제
  // @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name; // 확장자를 제외한 값
      const split = filename.split('_');
      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();
        return now - date > aDayInMilSec;
      } catch (e) {}
    });

    await Promise.all(
      deleteFilesTargets.map((x) => {
        unlink(join(process.cwd(), 'public', 'temp', x));
      }),
    );
  }

  /// 1분마다 좋아요/싫어요 갯수 업데이트
  // @Cron('0 * * * * *')
  async calculateMovieLikeCounts() {
    await this.movieRepo.query(
      `
        UPDATE movie m
        SET "likeCount" = (
          SELECT count(*) FROM movie_user_like mul
          WHERE m.id = mul."movieId" AND mul."isLike" = true
        )
      `,
    );
    await this.movieRepo.query(
      `
        UPDATE movie m
        SET "dislikeCount" = (
          SELECT count(*) FROM movie_user_like mul
          WHERE m.id = mul."movieId" AND mul."isLike" = false
        )
      `,
    );
  }

  /// Cron 이름 설정
  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('print every second');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    console.log('----stopper run----');

    const job = this.schedulerRegistry.getCronJob('printer');

    console.log('# last date');
    console.log(job.lastDate());

    console.log('# next date');
    console.log(job.nextDate());

    console.log('# next dates');
    console.log(job.nextDates(5));

    // 강의에선 job.running
    if (job.isActive) {
      job.stop();
    } else {
      job.start();
    }
  }
}
