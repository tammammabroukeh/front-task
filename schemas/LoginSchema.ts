import { z } from "zod";

/** Validation schema for the admin login form. */
export const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
