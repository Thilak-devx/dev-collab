const { z } = require("zod");

const objectIdMessage = "Invalid resource identifier";
const passwordMessage =
  "Password must be at least 8 characters and include a number and a special character";

const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, objectIdMessage);

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, passwordMessage)
  .regex(/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, passwordMessage);

const statusSchema = z.enum(["todo", "in_progress", "done", "in-progress"]).transform((value) =>
  value === "in-progress" ? "in_progress" : value
);

const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const googleSchema = z.object({
  token: z.string().trim().min(1, "Google token is required"),
});

const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    email: emailSchema.optional(),
  })
  .refine((value) => value.name || value.email, {
    message: "Provide a name or email to update",
  });

const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters"),
  description: z.string().trim().min(8, "Project description must be at least 8 characters"),
  members: z.array(objectIdSchema).optional().default([]),
  admins: z.array(objectIdSchema).optional().default([]),
});

const projectInviteSchema = z.object({
  email: emailSchema.optional(),
  role: z.enum(["member", "admin"]).optional().default("member"),
});

const projectMembersSchema = z.object({
  members: z.array(objectIdSchema).min(1, "Select at least one project member"),
  admins: z.array(objectIdSchema).optional().default([]),
});

const taskCreateSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters"),
  description: z.string().trim().max(2000, "Description is too long").optional().default(""),
  status: statusSchema.optional().default("todo"),
  priority: prioritySchema.optional().default("medium"),
  projectId: objectIdSchema,
  assignedTo: objectIdSchema.nullish(),
  dueDate: z
    .union([z.string().datetime({ offset: true }), z.string().date()])
    .nullish(),
});

const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(2, "Task title must be at least 2 characters").optional(),
    description: z.string().trim().max(2000, "Description is too long").optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    assignedTo: objectIdSchema.nullish(),
    dueDate: z
      .union([z.string().datetime({ offset: true }), z.string().date()])
      .nullish()
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one task field to update",
  });

const taskQuerySchema = z.object({
  projectId: objectIdSchema.optional(),
});

const channelCreateSchema = z.object({
  name: z.string().trim().min(2, "Channel name must be at least 2 characters").max(50, "Channel name is too long"),
});

const messageCreateSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message is too long"),
});

const directMessageCreateSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message is too long"),
  channelId: objectIdSchema,
});

const taskFileCreateSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255, "File name is too long"),
  fileUrl: z.string().trim().url("File URL must be valid"),
  storagePath: z.string().trim().min(1, "Storage path is required").max(500, "Storage path is too long").optional(),
  fileType: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) =>
        [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "text/plain",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(value),
      "File type is not allowed"
    ),
  fileSize: z
    .coerce
    .number()
    .int("File size must be an integer")
    .positive("File size must be greater than zero")
    .max(5 * 1024 * 1024, "Files must be 5MB or smaller"),
});

const channelMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const notificationReadSchema = z.object({
  read: z.boolean(),
});

const resourceIdParamsSchema = z.object({
  id: objectIdSchema,
});

const inviteTokenParamsSchema = z.object({
  token: z.string().trim().min(32, "Invite token is invalid"),
});

const inviteCreateSchema = z.object({
  projectId: objectIdSchema,
  regenerate: z.boolean().optional().default(false),
  maxUses: z.number().int().min(1, "Max uses must be at least 1").nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleSchema,
  profileSchema,
  projectSchema,
  projectInviteSchema,
  projectMembersSchema,
  taskCreateSchema,
  taskUpdateSchema,
  taskQuerySchema,
  channelCreateSchema,
  messageCreateSchema,
  directMessageCreateSchema,
  taskFileCreateSchema,
  channelMessagesQuerySchema,
  notificationQuerySchema,
  notificationReadSchema,
  resourceIdParamsSchema,
  inviteTokenParamsSchema,
  inviteCreateSchema,
};
