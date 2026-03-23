import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('product/:id')
  createProductReview(
    @Param('id') productId: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    const buyerId = req.user.id;
    return this.reviewsService.createProductReview(buyerId, productId, rating, comment);
  }

  @UseGuards(JwtAuthGuard)
  @Post('seller/:id')
  createSellerReview(
    @Param('id') sellerId: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    const buyerId = req.user.id;
    return this.reviewsService.createSellerReview(buyerId, sellerId, rating, comment);
  }

  @Get('product/:id')
  getProductReviews(@Param('id') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Get('seller/:id')
  getSellerReviews(@Param('id') sellerId: string) {
    return this.reviewsService.getSellerReviews(sellerId);
  }
}
