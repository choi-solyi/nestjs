import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // username 대신 email 사용
    }); // Strategy를 사용할 땐 항상 super() 필요
  }

  /**
   * LocalStrategy
   *
   * validate: username, password
   *
   * return -> Request();
   */
  // 실제로 존재하는 사용자인지 검증
  async validate(username: string, password: string) {
    const user = this.authService.authenticate(username, password);

    return user;
  }
}
