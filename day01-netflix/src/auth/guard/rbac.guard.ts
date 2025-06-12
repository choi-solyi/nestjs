import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/user/entities/user.entity';
import { RBAC } from '../decorator/rbac.decorator';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Role>(RBAC, context.getHandler());

    // Role enum 에 해당되는 값이 데코레이터에 들어갔는지 확인하기

    if (!Object.values(Role).includes(role)) {
      return true; // 값이 없으면 그냥 패스
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // role 이 더 높으면 pass
    return user.role <= role;
  }
}
