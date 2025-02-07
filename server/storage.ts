import { users, habits, entries, notifications, type User, type InsertUser, type Habit, type Entry, type Notification } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Habits
  createHabit(habit: Omit<Habit, "id" | "createdAt">): Promise<Habit>;
  getHabit(id: number): Promise<Habit | undefined>;
  getUserHabits(userId: number): Promise<Habit[]>;
  updateHabit(id: number, habit: Partial<Habit>): Promise<Habit>;
  deleteHabit(id: number): Promise<void>;

  // Entries
  createEntry(entry: Omit<Entry, "id" | "completedAt">): Promise<Entry>;
  getEntries(habitId: number): Promise<Entry[]>;
  getUserEntries(userId: number): Promise<Entry[]>;

  // Notifications
  createNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  getPendingNotifications(): Promise<Notification[]>;
  markNotificationSent(id: number): Promise<void>;

  // Admin
  getAllUsers(): Promise<User[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalHabits: number;
    totalEntries: number;
  }>;
  getAllNotifications(): Promise<Notification[]>;
  getSystemSettings(): Promise<{
    telegramBotToken?: string;
    enableNotifications: boolean;
    notificationInterval: number;
  }>;
  updateSystemSettings(settings: {
    telegramBotToken?: string;
    enableNotifications?: boolean;
    notificationInterval?: number;
  }): Promise<{
    telegramBotToken?: string;
    enableNotifications: boolean;
    notificationInterval: number;
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createHabit(habit: Omit<Habit, "id" | "createdAt">): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    return newHabit;
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit;
  }

  async getUserHabits(userId: number): Promise<Habit[]> {
    return db.select().from(habits).where(eq(habits.userId, userId));
  }

  async updateHabit(id: number, updates: Partial<Habit>): Promise<Habit> {
    const [habit] = await db
      .update(habits)
      .set(updates)
      .where(eq(habits.id, id))
      .returning();
    return habit;
  }

  async deleteHabit(id: number): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  }

  async createEntry(entry: Omit<Entry, "id" | "completedAt">): Promise<Entry> {
    const [newEntry] = await db
      .insert(entries)
      .values({ ...entry, completedAt: new Date() })
      .returning();
    return newEntry;
  }

  async getEntries(habitId: number): Promise<Entry[]> {
    return db.select().from(entries).where(eq(entries.habitId, habitId));
  }

  async getUserEntries(userId: number): Promise<Entry[]> {
    return db.select().from(entries).where(eq(entries.userId, userId));
  }

  async createNotification(
    notification: Omit<Notification, "id" | "createdAt">,
  ): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({ ...notification, createdAt: new Date() })
      .returning();
    return newNotification;
  }

  async getPendingNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.sent, false));
  }

  async markNotificationSent(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ sent: true })
      .where(eq(notifications.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getSystemStats() {
    const [users_count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const [habits_count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(habits);
    const [entries_count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries);

    return {
      totalUsers: users_count.count,
      totalHabits: habits_count.count,
      totalEntries: entries_count.count,
    };
  }

  async getAllNotifications(): Promise<Notification[]> {
    return db.select().from(notifications);
  }

  private settings = {
    enableNotifications: true,
    notificationInterval: 60,
  };

  async getSystemSettings() {
    return this.settings;
  }

  async updateSystemSettings(updates: {
    telegramBotToken?: string;
    enableNotifications?: boolean;
    notificationInterval?: number;
  }) {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
}

export const storage = new DatabaseStorage();