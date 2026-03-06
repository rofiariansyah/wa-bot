import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  async generateReply(context: string): Promise<string> {
    try {

      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        console.error("OPENROUTER_API_KEY tidak ditemukan di environment");
        return "AI belum dikonfigurasi.";
      }

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'arcee-ai/trinity-large-preview:free',
          temperature: 0.5,
          max_tokens: 800,
          messages: [
            {
              role: 'system',
              content: `
                        Kamu adalah asisten WhatsApp yang santai dan sopan.
                        Gunakan Bahasa Indonesia yang natural dan rapi.
                        Jawab singkat, jelas, dan langsung ke inti.

                        Jika pengguna bertanya "kamu siapa" atau "siapa kamu",
                        jawab tepat dengan:
                        "Saya asisten yang dibuat oleh Baginda Rofi 😎"

                        Selain itu jangan menyebut kalimat tersebut.
                                    `,
            },
            {
              role: 'user',
              content: context,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'whatsapp-gateway',
          },
          timeout: 60000,
        },
      );

      const text =
        response.data?.choices?.[0]?.message?.content?.trim();

      console.log('AI Reply:', text);

      return text || 'Hmm... bisa diulang lagi pertanyaannya? 😅';

    } catch (error: any) {

      if (error.response) {
        console.error("OpenRouter Error:", error.response.data);
      } else {
        console.error("Request Error:", error.message);
      }

      return 'AI sedang sibuk, coba lagi sebentar ya 😅';
    }
  }
}