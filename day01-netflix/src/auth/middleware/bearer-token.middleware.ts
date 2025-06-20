import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
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
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Basic 토큰 또는 Bearer 토큰
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next(); // 이 미들웨어 끝내고 다음으로 가라
      return;
    }

    const token = this.validateBearerToken(authHeader);
    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockedToken) throw new UnauthorizedException('차단된 토큰입니다.');

    const tokenKey = `TOKEN_${token}`;
    const cachedPayload = await this.cacheManager.get(tokenKey);

    if (cachedPayload) {
      console.log('cachedPayload:', cachedPayload);
      req.user = cachedPayload;

      return next();
    }

    // decode는 검증은 하지 않는다.
    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰입니다');
    }
    try {
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
      if (e.name === 'TokenExpiredError')
        throw new UnauthorizedException('토큰이 만료 되었습니다.');

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
