import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  async generateReply(context: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'arcee-ai/trinity-large-preview:free',
          temperature: 0.4,          // 🔥 lebih stabil
          max_tokens: 400,           // 🔥 batasi biar tidak kepanjangan
          messages: [
            {
              role: 'system',
              content: `
                        Kamu adalah asisten WhatsApp yang santai dan sopan.
                        Gunakan Bahasa Indonesia yang natural dan rapi.
                        Jangan menggunakan kata aneh, typo, atau bercanda berlebihan.
                        Jawaban harus relevan dan langsung ke inti.

                        Jika pengguna bertanya tentang identitasmu (misalnya: "kamu siapa?", "siapa kamu?"),
                        jawab tepat dengan:
                        "Saya asisten yang dibuat oleh Baginda Rofi 😎"

                        Selain itu, jangan menyebut kalimat tersebut.

                        Jawab singkat, jelas, dan tidak bertele-tele.
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
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const text =
        response.data.choices?.[0]?.message?.content?.trim();
      console.log('AI Raw Reply:', text); // Debug: lihat balasan mentah dari AI
      return text || 'Hmm... bisa diulang lagi pertanyaannya? 😅';
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      return 'Lagi ada gangguan sedikit, coba lagi ya 😅';
    }
  }
}