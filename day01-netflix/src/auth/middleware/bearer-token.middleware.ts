import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Basic 토큰 또는 Bearer 토큰
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next(); // 이 미들웨어 끝내고 다음으로 가라
      return;
    }

    try {
      const token = this.validateBearerToken(authHeader);

      // decode는 검증은 하지 않는다.
      const decodedPayload = this.jwtService.decode(token);

      if (
        decodedPayload.type !== 'refresh' &&
        decodedPayload.type !== 'access'
      ) {
        throw new UnauthorizedException('잘못된 토큰입니다');
      }

      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey)!,
      });

      req.user = payload;
      next();
    } catch (e) {
      // middleware 다음에 guard 가 동작하므로 그냥 바로 next() 해버리면 됨
      next();
      // throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('Token 형식이 다릅니다');
    }

    const [bearer, token] = basicSplit;
    if (bearer.toLowerCase() !== 'bearer')
      throw new BadRequestException('Token 형식이 다릅니다');

    return token;
  }
}
