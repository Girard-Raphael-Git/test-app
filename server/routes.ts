import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { telegramService } from "./telegram";
import { insertHabitSchema, insertEntrySchema } from "@shared/schema";

function isAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) {
    return res.status(403).send("Admin access required");
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Habit routes
  app.post("/api/habits", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const habit = await storage.createHabit({
      ...parsed.data,
      userId: req.user.id,
    });
    res.status(201).json(habit);
  });

  app.get("/api/habits", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const habits = await storage.getUserHabits(req.user.id);
    res.json(habits);
  });

  app.patch("/api/habits/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const habit = await storage.getHabit(parseInt(req.params.id));
    if (!habit || habit.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    const updated = await storage.updateHabit(habit.id, req.body);
    res.json(updated);
  });

  app.delete("/api/habits/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const habit = await storage.getHabit(parseInt(req.params.id));
    if (!habit || habit.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    await storage.deleteHabit(habit.id);
    res.sendStatus(204);
  });

  // Entry routes
  app.post("/api/entries", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const entry = await storage.createEntry({
      ...parsed.data,
      userId: req.user.id,
    });
    res.status(201).json(entry);
  });

  app.get("/api/entries/:habitId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const entries = await storage.getEntries(parseInt(req.params.habitId));
    res.json(entries);
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    const { isAdmin: newIsAdmin } = req.body;

    if (typeof newIsAdmin !== "boolean") {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await storage.updateUser(userId, { isAdmin: newIsAdmin });
    res.json(updatedUser);

    // Create notification for role change
    await storage.createNotification({
      userId,
      type: "role_change",
      message: `Your role has been ${newIsAdmin ? "upgraded to admin" : "changed to user"}`,
      sent: false,
      habitId: 0, // System notification
    });
  });

  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    const stats = await storage.getSystemStats();
    res.json(stats);
  });

  app.get("/api/admin/notifications", isAdmin, async (req, res) => {
    const notifications = await storage.getAllNotifications();
    res.json(notifications);
  });

  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  });

  app.patch("/api/admin/settings", isAdmin, async (req, res) => {
    const { telegramBotToken, enableNotifications, notificationInterval } = req.body;

    // Validate settings
    if (notificationInterval && notificationInterval < 30) {
      return res.status(400).json({ message: "Notification interval must be at least 30 seconds" });
    }

    const settings = await storage.updateSystemSettings({
      telegramBotToken,
      enableNotifications,
      notificationInterval,
    });

    // If telegram token is updated, recreate the telegram service
    if (telegramBotToken) {
      process.env.TELEGRAM_BOT_TOKEN = telegramBotToken;
      // The telegram service will be recreated on next import
    }

    res.json(settings);
  });

  const httpServer = createServer(app);

  // Start notification checker with configurable interval
  let notificationInterval: NodeJS.Timeout;

  async function startNotificationChecker() {
    const settings = await storage.getSystemSettings();
    if (settings.enableNotifications) {
      clearInterval(notificationInterval);
      notificationInterval = setInterval(async () => {
        const notifications = await storage.getPendingNotifications();
        for (const notification of notifications) {
          const user = await storage.getUser(notification.userId);
          if (user?.telegramId && telegramService) {
            const sent = await telegramService.sendNotification(
              user.telegramId,
              notification.message,
            );
            if (sent) {
              await storage.markNotificationSent(notification.id);
            }
          }
        }
      }, (settings.notificationInterval || 60) * 1000);
    }
  }

  // Initial start
  startNotificationChecker();

  return httpServer;
}