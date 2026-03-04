import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WhatsappModule,
  ],
})
export class AppModule {}
// console.log(process.env.HF_API_KEY); // pastikan ini muncul di console saat aplikasi dijalankan 

