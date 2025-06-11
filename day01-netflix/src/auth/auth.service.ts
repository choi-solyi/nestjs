import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    // 1. 토큰을 띄어쓰기 기준으로 스프릿 한 뒤 토큰 값만 추출하기
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('Token 형식이 다릅니다');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic')
      throw new BadRequestException('Token 형식이 다릅니다');

    // 2. 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2)
      throw new BadRequestException('Token 형식이 다릅니다');

    const [email, password] = tokenSplit;

    return { email, password };
  }
  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('Token 형식이 다릅니다');
    }

    const [bearer, token] = basicSplit;
    if (bearer.toLowerCase() !== 'bearer')
      throw new BadRequestException('Token 형식이 다릅니다');

    try {
      //decode : 검증은 안하고  payload만 가져오는것
      //verify : payload도 가져오면서 검증도 함
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          envVariableKeys.refreshTokenSecret,
        )!,
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh')
          throw new BadRequestException('Refresh 토큰을 입력해주세요');
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요');
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({ where: { email } });
    if (user) throw new BadRequestException('이미 가입된 이메일입니다.');

    const rounds = this.configService.get<number>(envVariableKeys.hashRounds)!;
    const hash = await bcrypt.hash(password, rounds);

    await this.userRepository.save({
      email,
      password: hash,
    });
    return this.userRepository.findOne({ where: { email } });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('회원 정보가 존재하지 않습니다.');

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) throw new NotFoundException('회원 정보가 존재하지 않습니다.');
    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariableKeys.refreshTokenSecret,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVariableKeys.accessTokenSecret,
    );

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
