import { auth, firestore } from '@/lib/firebase/admin';
import { Session } from '../auth.model';

export class SessionRepository {
  private usersCollection = firestore().collection('users');

  private getSessionsCollection(uid: string) {
    return this.usersCollection.doc(uid).collection('sessions');
  }

  async createSessionRecord(session: Session) {
    await this.getSessionsCollection(session.uid).doc(session.sessionId).set(session);
  }

  async getSession(uid: string, sessionId: string): Promise<Session | null> {
    const doc = await this.getSessionsCollection(uid).doc(sessionId).get();
    return doc.exists ? (doc.data() as Session) : null;
  }

  async deleteSessionRecord(uid: string, sessionId: string) {
    try {
      await this.getSessionsCollection(uid).doc(sessionId).delete();
    } catch (e) {
      console.warn(`Failed to delete session ${sessionId}`, e);
    }
  }

  async getUserSessions(uid: string): Promise<Session[]> {
    const snapshot = await this.getSessionsCollection(uid).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as Session);
  }

  async revokeAllUserSessions(uid: string) {
    // 1. Revoke Firebase Refresh Tokens
    try {
      await auth().revokeRefreshTokens(uid);
    } catch (e) {
      // User might be deleted in Auth already
    }

    // 2. Delete Firestore Session Records
    const sessionsRef = this.getSessionsCollection(uid);
    const snapshot = await sessionsRef.get();
    if (snapshot.empty) return;

    // Batch delete (DRY: standard batching logic could be a shared lib util, but kept here for now)
    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async createSessionCookie(idToken: string, expiresIn: number) {
    return auth().createSessionCookie(idToken, { expiresIn });
  }

  async verifySessionCookie(sessionCookie: string) {
    return auth().verifySessionCookie(sessionCookie, true);
  }

  async verifyIdToken(idToken: string) {
    return auth().verifyIdToken(idToken);
  }

  async isSessionValid(uid: string, sessionId: string): Promise<boolean> {
    const doc = await this.getSessionsCollection(uid).doc(sessionId).get();
    if (!doc.exists) return false;

    const data = doc.data() as Session;

    // Check expiration
    if (data.expiresAt.toMillis() < Date.now()) return false;

    // Check manual invalidation flag
    return data.isValid;
  }
}

export const sessionRepository = new SessionRepository();
