import { EventType } from '@/lib/events';
import { logInfo } from '@/lib/logger';
import { JobHandler } from '../types';

export const inviteCreatedHandler: JobHandler = {
  eventName: EventType.INVITE_CREATED,
  handle: async (event) => {
    const { email, orgName, inviteLink } = event.payload as any;

    // SIMULATION: In a real app, use Resend/SendGrid here.
    logInfo(`📧 [EMAIL SENT] To: ${email} | Subject: Join ${orgName}`, {
      inviteLink,
      eventId: event.id,
    });

    // Update the actual Invite document to say "Sent" if needed,
    // or just rely on the event being marked as COMPLETED.
    // For this example, we just log it.
  },
};
