import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload.type';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input);
  }

  @Public()
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Public()
  @Mutation(() => AuthPayload)
  async refreshToken(@Args('token') token: string): Promise<AuthPayload> {
    return this.authService.refreshTokens(token);
  }

  @Mutation(() => Boolean)
  async logout(@CurrentUser() user: User): Promise<boolean> {
    return this.authService.logout(user.id);
  }

  @Query(() => User)
  me(@CurrentUser() user: User): User {
    return user;
  }
}
