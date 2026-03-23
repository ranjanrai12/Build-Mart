import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  getCategories() {
    return this.productsService.findAllCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Get('seller/inventory')
  getSellerInventory(@Request() req) {
    return this.productsService.findSellerInventory(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('seller/inventory/bulk')
  bulkUpdateStock(
    @Request() req,
    @Body('updates') updates: { id: string; stock: number }[]
  ) {
    return this.productsService.bulkUpdateStock(req.user.id, updates);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createProduct(@Request() req, @Body() dto: any) {
    return this.productsService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateProduct(@Param('id') id: string, @Request() req, @Body() dto: any) {
    return this.productsService.update(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  removeProduct(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.id);
  }

  @Get()
  getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(categoryId, sellerId, search);
  }

  @Get(':id')
  getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
