import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../auth/entities/address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async findAll(userId: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(userId: string, addressData: any): Promise<Address> {
    if (addressData.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }
    const address = new Address();
    Object.assign(address, { ...addressData, userId });
    return this.addressRepo.save(address);
  }

  async update(id: string, userId: string, addressData: any): Promise<Address> {
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (addressData.isDefault) {
      await this.addressRepo.update({ userId }, { isDefault: false });
    }

    Object.assign(address, addressData);
    return this.addressRepo.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.addressRepo.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Address not found');
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    await this.addressRepo.update({ userId }, { isDefault: false });
    const address = await this.addressRepo.findOne({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    address.isDefault = true;
    return this.addressRepo.save(address);
  }
}
