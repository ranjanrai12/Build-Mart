import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAllCategories() {
    return this.categoryRepo.find();
  }

  async findAll(categoryId?: string, sellerId?: string, search?: string) {
    const query = this.productRepo.createQueryBuilder('product');
    
    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    
    if (sellerId) {
      query.andWhere('product.sellerId = :sellerId', { sellerId });
    }
    
    if (search) {
      query.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` }
      );
    }
    
    return query.getMany();
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    
    const seller = await this.userRepo.findOne({ where: { id: product.sellerId } });
    return { ...product, seller };
  }

  async findSellerInventory(sellerId: string) {
    const products = await this.productRepo.find({ 
      where: { sellerId },
      order: { createdAt: 'DESC' }
    });

    return products.map(p => ({
      ...p,
      stockStatus: p.stock <= 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock'
    }));
  }

  async bulkUpdateStock(sellerId: string, updates: { id: string; stock: number }[]) {
    const ids = updates.map(u => u.id);
    const products = await this.productRepo.find({ 
      where: { id: (ids as any), sellerId } 
    });

    for (const update of updates) {
      const product = products.find(p => p.id === update.id);
      if (product) {
        product.stock = update.stock;
        product.inStock = update.stock > 0;
        await this.productRepo.save(product);
      }
    }
  }

  async create(dto: any, sellerId: string) {
    const product = this.productRepo.create({
      ...dto,
      sellerId,
      inStock: (dto.stock || 0) > 0
    });
    return this.productRepo.save(product);
  }

  async update(id: string, dto: any, sellerId: string) {
    const product = await this.productRepo.findOne({ where: { id, sellerId } });
    if (!product) throw new NotFoundException('Product not found or access denied');
    
    Object.assign(product, dto);
    if (dto.stock !== undefined) {
      product.inStock = dto.stock > 0;
    }
    
    return this.productRepo.save(product);
  }

  async remove(id: string, sellerId: string) {
    const product = await this.productRepo.findOne({ where: { id, sellerId } });
    if (!product) throw new NotFoundException('Product not found or access denied');
    
    await this.productRepo.remove(product);
    return { success: true };
  }
}
