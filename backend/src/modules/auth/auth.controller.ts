import { Controller, Post, Body, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(@CurrentUser() user: { id: string }, @Body() dto: UpdatePreferencesDto) {
    return this.authService.updatePreferences(user.id, dto);
  }
}
