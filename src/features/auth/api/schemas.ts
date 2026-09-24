import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]|[^A-Za-z0-9]/, 'Password must contain at least one number or symbol');

export const usernameSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(
        /^[a-z0-9._]+$/,
        'Username can only contain letters, numbers, periods, and underscores',
      )
      .refine((value) => !value.startsWith('.') && !value.endsWith('.'), {
        message: 'Username cannot start or end with a period',
      })
      .refine((value) => !value.includes('..'), {
        message: 'Username cannot contain consecutive periods',
      }),
  );

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Name must be less than 40 characters'),
});

export const signupIdentitySchema = z.object({
  email: z.email('Invalid email address'),
  username: usernameSchema,
});

export const signupPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Name must be less than 40 characters'),
  username: usernameSchema,
  email: z.email('Invalid email address'),
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupNameFormValues = z.infer<typeof signupNameSchema>;
export type SignupIdentityFormValues = z.infer<typeof signupIdentitySchema>;
export type SignupPasswordFormValues = z.infer<typeof signupPasswordSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
