import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { User } from '../database/models/user.model';
import { MailService } from '../mail/mail.service';
import { UserResponseDto } from './dto/user-response.dto';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<UserResponseDto> {
    const existing = await this.userModel.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName.trim(),
      passwordHash,
      role: Role.USER,
      isActive: true,
    });
    this.mailService.sendWelcome(user.email, user.fullName).catch(() => {});
    return this.toResponse(user);
  }

  async signin(dto: SigninDto): Promise<{ accessToken: string }> {
    const user = await this.userModel.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const expiresIn = this.config.get<string>('jwt.accessExpiresIn', '3600s');
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    } as unknown as { expiresIn?: number });
    return { accessToken };
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
