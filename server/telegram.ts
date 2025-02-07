import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";

export class TelegramService {
  private bot: TelegramBot;

  constructor(token: string) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupCommands();
  }

  private setupCommands() {
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot.sendMessage(
        chatId,
        "Welcome to HabitTracker! Please use /connect <username> to link your account.",
      );
    });

    this.bot.onText(/\/connect (.+)/, async (msg, match) => {
      if (!match) return;
      const chatId = msg.chat.id;
      const username = match[1];
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        await this.bot.sendMessage(chatId, "User not found.");
        return;
      }

      // Update user's telegram ID
      await storage.updateUser(user.id, { telegramId: chatId.toString() });
      await this.bot.sendMessage(
        chatId,
        "Successfully connected! You will now receive habit reminders here.",
      );
    });
  }

  async sendNotification(telegramId: string, message: string) {
    try {
      await this.bot.sendMessage(telegramId, message);
      return true;
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
      return false;
    }
  }
}

// Initialize telegram service if token is provided
export const telegramService = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramService(process.env.TELEGRAM_BOT_TOKEN)
  : null;
