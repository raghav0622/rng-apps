import 'server-only';

import { auth, firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { UserRoleInOrg } from '../enums';
import { CreateUserInDatabase, Session, User } from './auth.model';

export class AuthRepository {
  private usersCollection = firestore().collection('users');

  // --- SESSION MANAGEMENT ---

  private getSessionsCollection(uid: string) {
    return this.usersCollection.doc(uid).collection('sessions');
  }

  async createSessionRecord(session: Session) {
    await this.getSessionsCollection(session.uid).doc(session.sessionId).set(session);
  }

  async deleteSessionRecord(uid: string, sessionId: string) {
    if (!uid || !sessionId) return;
    try {
      await this.getSessionsCollection(uid).doc(sessionId).delete();
    } catch (error) {
      console.warn(`Failed to delete session ${sessionId} for user ${uid}`, error);
    }
  }

  async getUserSessions(uid: string): Promise<Session[]> {
    const snapshot = await this.getSessionsCollection(uid).orderBy('createdAt', 'desc').get();

    return snapshot.docs.map((doc) => doc.data() as Session);
  }

  async revokeAllUserSessions(uid: string) {
    // 1. Firebase Auth Level Revocation
    await auth().revokeRefreshTokens(uid);

    // 2. Database Level Cleanup
    const sessionsRef = this.getSessionsCollection(uid);
    const snapshot = await sessionsRef.get();

    if (snapshot.empty) return;

    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async isSessionValid(uid: string, sessionId: string): Promise<boolean> {
    const doc = await this.getSessionsCollection(uid).doc(sessionId).get();
    if (!doc.exists) return false;
    const data = doc.data() as Session;

    if (data.expiresAt.toMillis() < Date.now()) return false;

    return data.isValid;
  }

  async verifyIdToken(idToken: string) {
    return auth().verifyIdToken(idToken);
  }

  async createSessionCookie(idToken: string, expiresIn: number) {
    return auth().createSessionCookie(idToken, { expiresIn });
  }

  // --- USER MANAGEMENT ---

  async signUpUser(params: CreateUserInDatabase): Promise<Result<User>> {
    const userRef = this.usersCollection.doc(params.uid);
    const now = new Date();

    const snapshot = await userRef.get();

    if (snapshot.exists) {
      return { success: true, data: snapshot.data() as User };
    }

    const userData: User = {
      createdAt: now,
      updatedAt: now,
      displayName: params.displayName,
      photoUrl: '',
      email: params.email,
      emailVerified: false,
      onboarded: false,
      orgRole: UserRoleInOrg.NOT_IN_ORG,
      uid: params.uid,
      orgId: undefined,
      lastLoginAt: now,
      deletedAt: undefined,
    };

    await userRef.set(userData as User);

    return {
      success: true,
      data: userData,
    };
  }

  async getUserByEmail(email: string) {
    const snap = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snap.empty) throw new Error('User Profile not found');
    return snap.docs[0].data() as User;
  }

  /**
   * Fetches user by UID directly.
   */
  async getUser(uid: string): Promise<User> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) throw new Error('User not found');
    return doc.data() as User;
  }

  async verifySessionCookie(sessionCookie: string) {
    return auth().verifySessionCookie(sessionCookie, false);
  }
}

export const authRepository = new AuthRepository();
