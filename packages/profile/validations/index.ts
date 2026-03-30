import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .trim(),
  profilePhoto: z.string().url("Invalid URL").optional().or(z.literal("")),
  city: z.string().max(50, "City must be less than 50 characters").optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
