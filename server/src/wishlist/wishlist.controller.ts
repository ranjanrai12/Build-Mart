import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Request() req: any) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post(':productId')
  add(@Request() req: any, @Param('productId') productId: string) {
    return this.wishlistService.addToWishlist(req.user.id, productId);
  }

  @Delete(':productId')
  remove(@Request() req: any, @Param('productId') productId: string) {
    return this.wishlistService.removeFromWishlist(req.user.id, productId);
  }
}
