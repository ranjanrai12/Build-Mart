import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() userData: any) {
    return this.authService.register(userData);
  }

  @Post('login')
  login(@Body() loginData: any) {
    return this.authService.login(loginData);
  }

  @Post('phone-check')
  checkPhone(@Body('phone') phone: string) {
    return this.authService.phoneCheck(phone);
  }

  @Post('phone-login')
  phoneLogin(@Body() phoneData: any) {
    return this.authService.phoneLogin(phoneData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-update/request')
  requestUpdate(@Request() req: any, @Body() updateData: any) {
    return this.authService.requestProfileUpdate(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile-update/confirm')
  confirmUpdate(@Request() req: any, @Body() body: any) {
    const { updateData, otp } = body;
    return this.authService.confirmProfileUpdate(req.user.id, updateData, otp);
  }

  @UseGuards(JwtAuthGuard)
  @Post('seller/toggle-status')
  toggleStatus(@Request() req: any) {
    return this.authService.toggleStoreStatus(req.user.id);
  }
}
