import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/user.model';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, fullName } = registerDto;

    try {
      const existingUser = await this.userModel.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      if (password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new this.userModel({ email, password: hashedPassword, fullName });
      return await user.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to register user: ' + error.message);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async write(userId: number, content: string) {
    try {
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Here you would typically save the content to a database
      // For this example, we'll just return a success message
      return { userId, contentLength: content.length };
    } catch (error) {
      throw new BadRequestException('Failed to write content: ' + error.message);
    }
  }

  async getProfile(userId: number) {
    try {
      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'email', 'fullName'], // Exclude sensitive data like password
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return user;
    } catch (error) {
      console.log(userId);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred while fetching the profile');
    }
  }
}