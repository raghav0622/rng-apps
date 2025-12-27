import { env } from '@/lib/env';
import { Resend } from 'resend';

export const resend = new Resend(env.RESEND_API_KEY);

// 🛑 IMPORTANT: If you are using the 'onboarding@resend.dev' address, 
// you can only send emails to the email address you signed up for Resend with.
// To send to any email, you MUST verify a custom domain in Resend and update this.
export const EMAIL_FROM = 'RNG App <onboarding@resend.dev>'; 
