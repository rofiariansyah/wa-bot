import { Injectable, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
// import * as qrcode from 'qrcode-terminal';
import * as qrcode from 'qrcode';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any;
  private isConnecting = false;
  private isConnected = false;
  private currentQr: string | null = null;
  // private isConnected = false;

  private chatHistory: Record<string, string[]> = {};

  constructor(private aiService: AiService) {}

  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      printQRInTerminal: false,
    });

    // ================= CONNECTION HANDLER =================
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // if (qr) {
      //   console.log('Scan QR ini:');
      //   qrcode.generate(qr, { small: true });
      // }

      if (qr) {
        console.log('QR received');

        // Convert ke base64 image
        this.currentQr = await qrcode.toDataURL(qr);
      }

      // if (connection === 'open') {
      //   console.log('WhatsApp Connected ✅');
      //   this.isConnecting = false;
      //   this.isConnected = true;
      // }

      if (connection === 'open') {
        console.log('WhatsApp Connected ✅');

        this.isConnecting = false;
        this.isConnected = true;

        this.currentQr = null;
      }

      if (connection === 'close') {
        const statusCode =
          (lastDisconnect?.error as any)?.output?.statusCode;

        const isLoggedOut =
          statusCode === DisconnectReason.loggedOut;

        console.log('Connection closed.');
        console.log('Logged out:', isLoggedOut);

        this.isConnected = false;
        this.isConnecting = false;

        if (isLoggedOut) {
          console.log('Session expired. Deleting auth folder...');

          // 🔥 HAPUS AUTH FOLDER
          const authPath = path.join(process.cwd(), 'auth');
          if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
          }

          this.currentQr = null;

          // 🔥 Connect ulang
          setTimeout(() => this.connect(), 3000);
        } else {
          console.log('Reconnecting...');
          setTimeout(() => this.connect(), 3000); 
        }
      }
    });

    // ================= MESSAGE HANDLER =================
    this.sock.ev.on('messages.upsert', async (event) => {
      if (event.type !== 'notify') return;

      for (const msg of event.messages) {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;

        // const sender = msg.key.remoteJid;
        const sender =
          msg.key.participant || msg.key.remoteJid;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          '';

        if (!text) continue;

        console.log('================================');
        console.log('Pesan masuk dari:', sender);
        console.log('Isi:', text);
        console.log('================================');

        await this.handleIncomingMessage(sender, text);
      }
    });

    this.sock.ev.on('creds.update', saveCreds);
  }

  // ================= AUTO REPLY LOGIC =================
  // ================= AUTO REPLY LOGIC =================
  private async handleIncomingMessage(sender: string, text: string) {
    const lower = text.toLowerCase();
    const role = this.getRoleFromSender(sender);

    // ================= COMMAND HANDLER =================
    if (lower === 'ping') {
      await this.sock.sendMessage(sender, { text: 'pong 🏓' });
      return;
    }

    if (lower === 'halo') {
      await this.sock.sendMessage(sender, { text: `Halo ${role} 👋` });
      return;
    }

    // ================= INIT MEMORY =================
    if (!this.chatHistory[sender]) {
      this.chatHistory[sender] = [];
    }

    // Simpan pesan user
    this.chatHistory[sender].push(`User (${role}): ${text}`);

    // Batasi maksimal 10 pesan terakhir
    this.chatHistory[sender] = this.chatHistory[sender].slice(-10);

    const context = this.chatHistory[sender].join('\n');

    // ================= TYPING INDICATOR =================
    await this.sock.sendPresenceUpdate('composing', sender);

    // ================= AI GENERATE =================
    const aiReply = await this.aiService.generateReply(context);

    // 🔥 Bersihkan kalau AI ikut menambahkan prefix sendiri
    // const cleanReply = aiReply.replace(/^(Baginda,|Rakyat Jelata,)\s*/i, '');
    const cleanReply = aiReply
      .replace(/baginda/gi, '')
      .replace(/rakyat jelata/gi, '')
      .replace(/^[,\s]+/, '')
      .trim();

    // 🔥 Tambahkan prefix sesuai role
    const finalReply = `${role}, ${cleanReply}`;

    // Simpan balasan bot
    this.chatHistory[sender].push(`Bot: ${finalReply}`);

    // Kirim ke user
    await this.sock.sendMessage(sender, {
      text: finalReply,
    });
  }

  // ================= SEND VIA API =================
  async sendMessage(phone: string, message: string) {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp belum terkoneksi');
    }

    const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';

    await this.sock.sendMessage(jid, { text: message });

    return {
      status: 'success',
      to: phone,
      message,
    };
  }

  private VIP_USERS = [
  '273353294254203@lid'
  ];

  private getRoleFromSender(sender: string): string {
    if (this.VIP_USERS.includes(sender)) {
      return 'Baginda';
    }

    return 'Rakyat Jelata';
  }

  // ================= STATUS =================
  getStatus() {
    return {
      connected: this.isConnected,
    };
  }
loader
  getQr() {
    return this.currentQr;
  }
}