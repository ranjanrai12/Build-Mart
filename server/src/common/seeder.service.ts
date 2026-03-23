import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  async onApplicationBootstrap() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) return; // Already seeded

    console.log('🌱 Seeding database...');

    // 1. Seed Categories
    const categories = [
      { id: 'c1', name: 'Cement', icon: 'layers', color: '#7F8C8D', gradient: ['#BDC3C7', '#7F8C8D'] },
      { id: 'c2', name: 'Steel', icon: 'build', color: '#2C3E50', gradient: ['#4CA1AF', '#2C3E50'] },
      { id: 'c3', name: 'Sand', icon: 'grain', color: '#D4AC0D', gradient: ['#F9CA24', '#D4AC0D'] },
      { id: 'c4', name: 'Bricks', icon: 'view-module', color: '#C0392B', gradient: ['#E55039', '#C0392B'] },
      { id: 'c5', name: 'Tiles', icon: 'grid-on', color: '#1ABC9C', gradient: ['#43B89C', '#1ABC9C'] },
    ];
    await this.categoryRepo.save(categories);

    // 2. Seed Sellers (as Users)
    const sellers = [
      {
        id: 's1', name: 'Sharma Building Supplies', email: 'sharma@buildmart.com', password: 'password123',
        role: UserRole.SELLER, phone: '9810012345', rating: 4.8, totalReviews: 342,
        location: 'Karol Bagh, Delhi', isVerified: true, businessDescription: 'Trusted supplier...',
        coordinates: { lat: 28.6448, lng: 77.1872 }
      },
      {
        id: 's2', name: 'Patel Materials Co.', email: 'patel@buildmart.com', password: 'password123',
        role: UserRole.SELLER, phone: '9022056789', rating: 4.6, totalReviews: 218,
        location: 'Andheri, Mumbai', isVerified: true, businessDescription: 'Mumbai\'s go-to store...',
        coordinates: { lat: 19.1136, lng: 72.8697 }
      }
    ];
    await this.userRepo.save(sellers);

    // 3. Seed Products
    const products = [
      {
        id: 'p1', categoryId: 'c1', sellerId: 's1', name: 'UltraTech Cement',
        price: 380, unit: 'bag (50 kg)', stock: 500, inStock: true, rating: 4.8,
        description: 'OPC 53 Grade Portland Cement...',
        pricingTiers: [
          { minQty: 100, price: 370 },
          { minQty: 500, price: 360 }
        ]
      },
      {
        id: 'p3', categoryId: 'c2', sellerId: 's1', name: 'SAIL TMT Bar',
        price: 65000, unit: 'tonne', stock: 80, inStock: true, rating: 4.9,
        description: 'High-strength TMT rebars...',
        pricingTiers: [
          { minQty: 5, price: 64000 },
          { minQty: 20, price: 62500 }
        ]
      }
    ];
    await this.productRepo.save(products);

    console.log('✅ Seeding complete!');
  }
}
