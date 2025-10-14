// * User DTOs

import { z } from 'zod';

import { EmailSchema } from '@lapasar/shared-kernel';

export const RegisterUserDTOSchema = z.object({
  email: EmailSchema,
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
});
export type RegisterUserDTO = z.infer<typeof RegisterUserDTOSchema>;

export const LoginUserDTOSchema = z.object({
  email: EmailSchema,
  password: z.string(),
});
export type LoginUserDTO = z.infer<typeof LoginUserDTOSchema>;

export const UserResponseDTOSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.date(),
});
export type UserResponseDTO = z.infer<typeof UserResponseDTOSchema>;

export const LoginResponseDTOSchema = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
  user: UserResponseDTOSchema,
});
export type LoginResponseDTO = z.infer<typeof LoginResponseDTOSchema>;

export const UpdateUserProfileDTOSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: EmailSchema.optional(),
});
export type UpdateUserProfileDTO = z.infer<typeof UpdateUserProfileDTOSchema>;
