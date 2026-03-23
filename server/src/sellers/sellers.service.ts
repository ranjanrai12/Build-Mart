import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepo.find({ 
      where: { role: UserRole.SELLER },
      order: { rating: 'DESC' }
    });
  }

  async findOne(id: string) {
    const seller = await this.userRepo.findOne({ 
      where: { id, role: UserRole.SELLER } 
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }

  async claimSeller(id: string, buyerId: string) {
    const seller = await this.findOne(id);
    
    if (seller.isVerified) {
      throw new Error('This business is already verified and claimed.');
    }
    
    if (seller.claimStatus === 'Pending' || seller.claimStatus === 'Verified') {
      throw new Error('A claim is already in progress for this business.');
    }

    seller.claimedBy = buyerId;
    seller.claimStatus = 'Pending';
    
    return this.userRepo.save(seller);
  }

  async updateProfile(id: string, updateData: Partial<User>) {
    const seller = await this.findOne(id);
    
    // Whitelist allow-listed fields for security
    const { name, businessDescription, location, bannerImage, operatingHours, isStoreOpen, phone } = updateData;
    
    if (name) seller.name = name;
    if (businessDescription) seller.businessDescription = businessDescription;
    if (location) seller.location = location;
    if (bannerImage) seller.bannerImage = bannerImage;
    if (operatingHours) seller.operatingHours = operatingHours;
    if (typeof isStoreOpen === 'boolean') seller.isStoreOpen = isStoreOpen;
    if (phone) seller.phone = phone;

    return this.userRepo.save(seller);
  }
}
