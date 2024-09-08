import { Controller, Post, Body, BadRequestException, UseGuards, Request, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { WriteDto } from './dtos/write.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authService.register(registerDto);
      return { message: 'User registered successfully', user };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('write')
  @HttpCode(HttpStatus.OK)
  async write(@Request() req, @Body() writeDto: WriteDto) {
    try {
      const result = await this.authService.write(req.user.userId, writeDto.content);
      return { message: 'Content written successfully', result };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}