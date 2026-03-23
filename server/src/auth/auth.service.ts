import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(userData: any) {
    const { email, password, name, role } = userData;
    const existingUser = await this.userRepo.findOne({ where: { email } });
    
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      name,
      role: role || UserRole.BUYER,
    });

    await this.userRepo.save(user);
    return this.generateToken(user);
  }

  async login(loginData: any) {
    const { email, password } = loginData;
    const user = await this.userRepo.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role'] // Explicitly select password
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  async phoneCheck(phone: string) {
    const normalizedInput = phone.replace(/\D/g, '');
    const users = await this.userRepo.find();
    const user = users.find(u => u.phone && u.phone.replace(/\D/g, '').endsWith(normalizedInput));
    return { exists: !!user };
  }

  async phoneLogin(phoneData: any) {
    const { phone, name, role, businessName, isRegister } = phoneData;
    
    // Normalize input phone: strip all non-digits
    const normalizedInput = phone.replace(/\D/g, '');
    
    // Fetch all users and find match (or use a better regex/normalization in DB)
    // For SQLite/TypeORM simplicity in this POC, we'll fetch and match or use ILIKE
    const users = await this.userRepo.find();
    let user = users.find(u => u.phone && u.phone.replace(/\D/g, '').endsWith(normalizedInput));

    if (!user) {
      if (!isRegister) {
        throw new UnauthorizedException('Account not found. Please sign up first.');
      }
      
      // Explicit registration
      user = this.userRepo.create({
        phone,
        name: name || 'User',
        role: role || UserRole.BUYER,
        businessDescription: businessName,
        email: `${phone}@buildmart.com`,
        password: await bcrypt.hash('otp-default-pass', 10),
      });
      await this.userRepo.save(user);
    } else if (isRegister) {
      throw new ConflictException('Account already exists. Please log in.');
    }

    return this.generateToken(user);
  }

  private normalizePhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  async requestProfileUpdate(userId: string, updateData: any) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const emailChanged = updateData.email && updateData.email !== user.email;
    const phoneChanged = updateData.phone && this.normalizePhone(updateData.phone) !== this.normalizePhone(user.phone);

    if (emailChanged || phoneChanged) {
      // Mock OTP sending
      return { otpRequired: true, message: 'OTP sent to your new contact info' };
    }

    // No sensitive changes
    return { otpRequired: false };
  }

  async confirmProfileUpdate(userId: string, updateData: any, otp: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    console.log('Confirming update for user:', userId, 'Body:', updateData, 'OTP:', otp);
    const emailChanged = updateData.email && updateData.email !== user.email;
    const phoneChanged = updateData.phone && this.normalizePhone(updateData.phone) !== this.normalizePhone(user.phone);

    if ((emailChanged || phoneChanged) && (!otp || otp.length !== 4)) {
      throw new UnauthorizedException('Invalid OTP. Use any 4 digits (e.g., 1234)');
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.phone) user.phone = updateData.phone;

    await this.userRepo.save(user);
    return this.generateToken(user);
  }

  async toggleStoreStatus(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.isStoreOpen = !user.isStoreOpen;
    await this.userRepo.save(user);
    return { isStoreOpen: user.isStoreOpen };
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, phone: user.phone };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}
