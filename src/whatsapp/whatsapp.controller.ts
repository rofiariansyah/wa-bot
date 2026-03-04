import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import express from 'express';

@Controller('wa')
export class WhatsappController {
  constructor(private readonly waService: WhatsappService) {}

  // 🔹 Endpoint kirim pesan
  @Post('send')
  async send(@Body() body: any) {
    return this.waService.sendMessage(
      body.phone,
      body.message,
    );
  }

  // 🔹 Endpoint status JSON
  @Get('qr')
  getQr() {
    return {
      qr: this.waService.getQr(),
      connected: this.waService.getStatus().connected,
    };
  }

  @Get('page')
  renderQrPage(@Res() res: any) {
    return res.sendFile('qr.html', { root: 'view' });
  }
}