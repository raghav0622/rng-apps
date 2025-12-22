import 'server-only';

import { auth, firestore } from '@/lib/firebase/admin';
import { Result } from '@/lib/types';
import { UserRoleInOrg } from '../enums';
import { CreateUserInDatabase, Session, User } from './auth.model';

export class AuthRepository {
  private usersCollection = firestore().collection('users');

  private getSessionsCollection(uid: string) {
    return this.usersCollection.doc(uid).collection('sessions');
  }

  // ... (Keep existing methods: createSessionRecord, deleteSessionRecord, getUserSessions, revokeAllUserSessions, isSessionValid, verifyIdToken, createSessionCookie, signUpUser, getUserByEmail, getUser, verifySessionCookie)

  async createSessionRecord(session: Session) {
    await this.getSessionsCollection(session.uid).doc(session.sessionId).set(session);
  }

  async deleteSessionRecord(uid: string, sessionId: string) {
    try {
      await this.getSessionsCollection(uid).doc(sessionId).delete();
    } catch (e) {
      console.warn('Delete session error', e);
    }
  }

  async getUserSessions(uid: string): Promise<Session[]> {
    const snapshot = await this.getSessionsCollection(uid).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as Session);
  }

  async revokeAllUserSessions(uid: string) {
    try {
      await auth().revokeRefreshTokens(uid);
    } catch (e) {}

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
    return { success: true, data: userData };
  }

  async getUserByEmail(email: string) {
    const snap = await this.usersCollection.where('email', '==', email).limit(1).get();
    if (snap.empty) throw new Error('User Profile not found');
    return snap.docs[0].data() as User;
  }

  async getUser(uid: string): Promise<User> {
    const doc = await this.usersCollection.doc(uid).get();
    if (!doc.exists) throw new Error('User not found');
    return doc.data() as User;
  }

  async verifySessionCookie(sessionCookie: string) {
    return auth().verifySessionCookie(sessionCookie, false);
  }

  // --- NEW REPO METHODS ---

  async updateUser(uid: string, data: Partial<User>) {
    await this.usersCollection.doc(uid).update({
      ...data,
      updatedAt: new Date(),
    });
  }

  async deleteUserAndSessions(uid: string) {
    // 1. Delete Sessions
    await this.revokeAllUserSessions(uid);

    // 2. Delete User Doc
    await this.usersCollection.doc(uid).delete();
  }
}

export const authRepository = new AuthRepository();
