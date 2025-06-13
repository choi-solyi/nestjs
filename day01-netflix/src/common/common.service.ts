import { PagePaginationDto } from './dto/page-pagination.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;

    const skip = (page - 1) * take;

    qb.take(take);
    qb.skip(skip);
  }

  async applyCursorPaginationParamsToQb<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    let { cursor, order, take } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      const cursorObj = JSON.parse(decodedCursor);

      order = cursorObj.order;

      const { values } = cursorObj;

      /// (column1, column2, column3) > (:value1, :value2, :value3)
      const columns = Object.keys(values);
      const comparisonOperator = order.some((o) => o.endsWith('DESC'))
        ? '>'
        : '<';
      const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');

      const whereParams = columns.map((c) => `:${c}`).join(',');

      // [SQL]
      // WHERE (column1 > value1)
      //    OR (column1 = value1 AND column2 > value2)
      //    OR (column1 = value1 AND column2 = value2 AND column3 > value3)

      /// (column1, column2, column3) > (:value1, :value2, :value3)
      qb.where(
        `((${whereConditions}) ${comparisonOperator} (${whereParams}))`,
        values,
      );
    }

    // ["likeCount_DESC", "id_ASD"]
    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split('_');

      if (direction !== 'ASC' && direction !== 'DESC')
        throw new BadRequestException(
          'Order는 ASC 또는 DESC만 입력하실 수 있습니다.',
        );

      if (i === 0) {
        // qb.orderBy('movie.likeCount', 'ASC')
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();
    const nextCursor = this.generateNextCursor(results, order);

    return { qb, nextCursor };
  }
  generateNextCursor<T>(results: T[], order: string[]): string | null {
    if (results.length === 0) return null;

    const lastItem = results[results.length - 1];
    const values = {};

    order.forEach((columnOrder) => {
      const [column] = columnOrder.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, order };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    );

    return nextCursor;
  }
}
