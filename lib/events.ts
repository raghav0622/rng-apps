import { firestore } from '@/lib/firebase/admin';
import { Timestamp, Transaction } from 'firebase-admin/firestore';
import 'server-only';
import { z } from 'zod';

// --- Core Event Types ---

export enum EventType {
  // Auth
  USER_CREATED = 'auth.user.created',
  USER_LOGGED_IN = 'auth.user.logged_in',

  // Organization
  ORG_CREATED = 'org.created',
  ORG_UPDATED = 'org.updated',
  ORG_DELETED = 'org.deleted',

  // Members / Invites
  INVITE_CREATED = 'org.invite.created',
  INVITE_ACCEPTED = 'org.invite.accepted',
  INVITE_REJECTED = 'org.invite.rejected',
  MEMBER_ROLE_UPDATED = 'org.member.role_updated',
  MEMBER_REMOVED = 'org.member.removed',
}

/**
 * The structure of a persistent domain event.
 * Stored in `events` collection for async processing.
 */
export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType;
  payload: T;
  occurredAt: Timestamp;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingErrors?: string[];
  processedAt?: Timestamp | null;
  // Metadata for tracing
  traceId?: string;
  actorId?: string;
  orgId?: string;
}

// --- Schemas for Payload Validation (Optional but recommended) ---
export const BaseEventSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(EventType),
  occurredAt: z.any(), // Timestamp
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
});

// --- Event Publisher ---

/**
 * Publishes an event transactionally.
 * This MUST be used within a Firestore Transaction to guarantee atomicity.
 */
export const publishEvent = <T>(
  t: Transaction,
  type: EventType,
  payload: T,
  meta: { traceId?: string; actorId?: string; orgId?: string } = {},
) => {
  const eventRef = firestore().collection('events').doc();
  const event: DomainEvent<T> = {
    id: eventRef.id,
    type,
    payload,
    occurredAt: Timestamp.now(),
    status: 'PENDING',
    traceId: meta.traceId,
    actorId: meta.actorId,
    orgId: meta.orgId,
  };

  t.set(eventRef, event);
  return event;
};
