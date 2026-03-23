import { Controller, Get, Post, Body, Param, Put, Request, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuoteStatus } from './entities/quote-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  getAllQuotes() {
    return this.quotesService.findAll();
  }

  @Post()
  create(@Body() quoteData: any, @Request() req: any) {
    const buyerId = req.user.id;
    return this.quotesService.createQuoteRequest(buyerId, quoteData);
  }

  @Get('buyer')
  getBuyerQuotes(@Request() req: any) {
    const buyerId = req.user.id;
    return this.quotesService.getBuyerQuotes(buyerId);
  }

  @Get('seller')
  getSellerQuotes(@Request() req: any) {
    const sellerId = req.user.id;
    return this.quotesService.getSellerQuotes(sellerId);
  }

  @Post(':id/respond')
  respond(@Param('id') id: string, @Body() responseData: any) {
    return this.quotesService.respondToQuote(id, responseData);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Request() req: any) {
    const buyerId = req.user.id;
    return this.quotesService.acceptQuote(id, buyerId);
  }

  @Post(':id/reject-buyer')
  rejectByBuyer(@Param('id') id: string, @Request() req: any) {
    const buyerId = req.user.id;
    return this.quotesService.rejectByBuyer(id, buyerId);
  }

  @Post(':id/accept-seller')
  acceptBySeller(@Param('id') id: string) {
    return this.quotesService.acceptBySeller(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: QuoteStatus) {
    return this.quotesService.updateQuoteStatus(id, status);
  }
}
