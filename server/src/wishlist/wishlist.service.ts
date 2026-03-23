import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem) private readonly wishlistRepo: Repository<WishlistItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getWishlist(userId: string) {
    return this.wishlistRepo.find({
      where: { user: { id: userId } },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async addToWishlist(userId: string, productId: string) {
    const existing = await this.wishlistRepo.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existing) throw new ConflictException('Product already in wishlist');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (!user || !product) throw new NotFoundException('User or Product not found');

    const item = this.wishlistRepo.create({ user, product });
    return this.wishlistRepo.save(item);
  }

  async removeFromWishlist(userId: string, productId: string) {
    const item = await this.wishlistRepo.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (!item) throw new NotFoundException('Wishlist item not found');
    return this.wishlistRepo.remove(item);
  }
}
