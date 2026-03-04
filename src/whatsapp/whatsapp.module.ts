import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    AiModule, // ⬅️ supaya WhatsappService bisa pakai AiService
  ],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}