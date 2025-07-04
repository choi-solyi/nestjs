import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { LocalAuthGuard } from './strategy/local.strategy';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  /// authorization: Basic $token
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.tokenBlock(token);
  }

  @Public()
  @ApiBasicAuth()
  @Post('login')
  // loginUser(@Headers('authorization') token: string) {
  // authrozation 데코레이터 사용
  loginUser(@Authorization() token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  // 이하 Passport 사용하는 코드
  @UseGuards(LocalAuthGuard) // LocalStrategy의 validate가 실행된다
  @Post('login/passport')
  async loginUserPassport(@Request() req) {
    // return req.user; //

    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    return req;
  }
}
