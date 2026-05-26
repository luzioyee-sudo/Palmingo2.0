import {
  pgTable, pgEnum, text, uuid, integer, boolean, timestamp,
} from "drizzle-orm/pg-core";

export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "rejected"]);
export const roomTypeEnum         = pgEnum("room_type",         ["war", "voice"]);
export const memberRoleEnum       = pgEnum("member_role",       ["admin", "moderator", "member"]);
export const msgTypeEnum          = pgEnum("msg_type",          ["text", "system", "challenge"]);

export const socialUsers = pgTable("social_users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  username:  text("username").notNull().unique(),
  name:      text("name").notNull(),
  xp:        integer("xp").notNull().default(0),
  streak:    integer("streak").notNull().default(0),
  level:     text("level").notNull().default("A1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id:          uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  addresseeId: uuid("addressee_id").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  status:      friendshipStatusEnum("status").notNull().default("pending"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  type:        roomTypeEnum("type").notNull().default("voice"),
  adminId:     uuid("admin_id").notNull().references(() => socialUsers.id),
  inviteCode:  text("invite_code").notNull().unique(),
  maxMembers:  integer("max_members").notNull().default(12),
  isPublic:    boolean("is_public").notNull().default(false),
  targetLang:  text("target_lang").notNull().default("English"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const roomMembers = pgTable("room_members", {
  id:       uuid("id").primaryKey().defaultRandom(),
  roomId:   uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId:   uuid("user_id").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  role:     memberRoleEnum("role").notNull().default("member"),
  muted:    boolean("muted").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const roomMessages = pgTable("room_messages", {
  id:        uuid("id").primaryKey().defaultRandom(),
  roomId:    uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").references(() => socialUsers.id, { onDelete: "set null" }),
  username:  text("username"),
  content:   text("content").notNull(),
  type:      msgTypeEnum("type").notNull().default("text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SocialUser   = typeof socialUsers.$inferSelect;
export type Room         = typeof rooms.$inferSelect;
export type RoomMember   = typeof roomMembers.$inferSelect;
export type RoomMessage  = typeof roomMessages.$inferSelect;
export type Friendship   = typeof friendships.$inferSelect;
