import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthPayload } from './dto/auth-payload.type';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthError } from './auth.error';
import { UserError } from '../users/users.error';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(input: RegisterInput): Promise<AuthPayload> {
    const passwordHash = await bcrypt.hash(input.password, this.SALT_ROUNDS);
    const user = await this.usersService.create(input.email, passwordHash);
    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException(AuthError.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException(AuthError.INVALID_CREDENTIALS);
    }

    return this.issueTokens(user);
  }

  async refreshTokens(rawRefreshToken: string): Promise<AuthPayload> {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(AuthError.TOKEN_EXPIRED);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new NotFoundException(UserError.USER_NOT_FOUND);
    }

    // Validate stored hash
    const storedTokens = await this.refreshTokenRepository.find({
      where: { userId: user.id },
    });

    let tokenValid = false;
    let matchedToken: RefreshToken | null = null;
    for (const stored of storedTokens) {
      if (await bcrypt.compare(rawRefreshToken, stored.tokenHash)) {
        tokenValid = true;
        matchedToken = stored;
        break;
      }
    }

    if (!tokenValid || !matchedToken) {
      throw new UnauthorizedException(AuthError.TOKEN_NOT_RECOGNIZED);
    }

    // Rotate: delete old token, issue new pair
    await this.refreshTokenRepository.delete(matchedToken.id);
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<boolean> {
    await this.refreshTokenRepository.delete({ userId });
    return true;
  }

  private async issueTokens(user: User): Promise<AuthPayload> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });

    // Hash and store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken, user };
  }
}
