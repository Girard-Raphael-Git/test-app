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

  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    const stats = await storage.getSystemStats();
    res.json(stats);
  });

  const httpServer = createServer(app);

  // Start notification checker
  setInterval(async () => {
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
  }, 60000);

  return httpServer;
}
