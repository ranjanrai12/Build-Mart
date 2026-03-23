import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findAll(@Request() req) {
    return this.cartService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() body) {
    return this.cartService.createOrUpdate(req.user.id, body);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body('quantity') quantity: number) {
    return this.cartService.updateQuantity(id, req.user.id, quantity);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.cartService.remove(id, req.user.id);
  }

  @Delete()
  clear(@Request() req) {
    return this.cartService.clear(req.user.id);
  }
}
