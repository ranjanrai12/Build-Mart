import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.addressesService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() addressData: any) {
    return this.addressesService.create(req.user.id, addressData);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() addressData: any) {
    return this.addressesService.update(id, req.user.id, addressData);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.addressesService.remove(id, req.user.id);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string, @Request() req: any) {
    return this.addressesService.setDefault(id, req.user.id);
  }
}
