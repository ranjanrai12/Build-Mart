import { Controller, Get, Param, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  getSellers() {
    return this.sellersService.findAll();
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Request() req: any, @Body() updateData: any) {
    return this.sellersService.updateProfile(req.user.id, updateData);
  }

  @Get(':id')
  getSeller(@Param('id') id: string) {
    return this.sellersService.findOne(id);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  claimSeller(@Param('id') id: string, @Request() req: any) {
    return this.sellersService.claimSeller(id, req.user.id);
  }
}
