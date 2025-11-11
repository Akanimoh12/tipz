import { z } from 'zod';
import { isAddress } from 'viem';

export const sttAmountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(1000000, 'Amount exceeds maximum limit')
  .refine((val) => val >= 0.001, {
    message: 'Minimum tip amount is 0.001 STT',
  });

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores')
  .refine((val) => !val.startsWith('_'), {
    message: 'Username cannot start with underscore',
  })
  .refine((val) => !val.endsWith('_'), {
    message: 'Username cannot end with underscore',
  });

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 2 * 1024 * 1024, {
    message: 'Image size must be less than 2MB',
  })
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    {
      message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
    }
  );

export const ethereumAddressSchema = z.string().refine(
  (address) => {
    try {
      return isAddress(address);
    } catch {
      return false;
    }
  },
  {
    message: 'Invalid Ethereum address',
  }
);

export const tipMessageSchema = z
  .string()
  .max(280, 'Message must be at most 280 characters')
  .optional();

export const profileDataSchema = z.object({
  username: usernameSchema,
  xFollowers: z.number().int().min(0, 'Followers count cannot be negative'),
  xPosts: z.number().int().min(0, 'Posts count cannot be negative'),
  xReplies: z.number().int().min(0, 'Replies count cannot be negative'),
  profileImageIpfs: z.string().min(1, 'Profile image is required'),
});

export const withdrawalSchema = z.object({
  amount: z
    .number()
    .positive('Withdrawal amount must be positive')
    .min(0.01, 'Minimum withdrawal is 0.01 STT'),
  address: ethereumAddressSchema,
});
