import { User, InsertUser, Habit, Entry, Notification } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private habits: Map<number, Habit>;
  private entries: Map<number, Entry>;
  private notifications: Map<number, Notification>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.habits = new Map();
    this.entries = new Map();
    this.notifications = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, isAdmin: false, telegramId: null };
    this.users.set(id, user);
    return user;
  }

  async createHabit(habit: Omit<Habit, "id" | "createdAt">): Promise<Habit> {
    const id = this.currentId++;
    const newHabit: Habit = {
      ...habit,
      id,
      createdAt: new Date(),
    };
    this.habits.set(id, newHabit);
    return newHabit;
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    return this.habits.get(id);
  }

  async getUserHabits(userId: number): Promise<Habit[]> {
    return Array.from(this.habits.values()).filter(
      (habit) => habit.userId === userId,
    );
  }

  async updateHabit(id: number, updates: Partial<Habit>): Promise<Habit> {
    const habit = this.habits.get(id);
    if (!habit) throw new Error("Habit not found");
    const updated = { ...habit, ...updates };
    this.habits.set(id, updated);
    return updated;
  }

  async deleteHabit(id: number): Promise<void> {
    this.habits.delete(id);
  }

  async createEntry(entry: Omit<Entry, "id" | "completedAt">): Promise<Entry> {
    const id = this.currentId++;
    const newEntry: Entry = {
      ...entry,
      id,
      completedAt: new Date(),
    };
    this.entries.set(id, newEntry);
    return newEntry;
  }

  async getEntries(habitId: number): Promise<Entry[]> {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.habitId === habitId,
    );
  }

  async getUserEntries(userId: number): Promise<Entry[]> {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.userId === userId,
    );
  }

  async createNotification(
    notification: Omit<Notification, "id" | "createdAt">,
  ): Promise<Notification> {
    const id = this.currentId++;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getPendingNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => !notification.sent,
    );
  }

  async markNotificationSent(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, sent: true });
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getSystemStats() {
    return {
      totalUsers: this.users.size,
      totalHabits: this.habits.size,
      totalEntries: this.entries.size,
    };
  }
}

export const storage = new MemStorage();
