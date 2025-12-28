import { AbstractFirestoreRepository } from '@/core/abstract-firestore-repository/abstract-firestore-repository';
import {
    Invite,
    InviteSchema,
    Member,
    MemberSchema,
    Organization,
    OrganizationSchema,
} from './organization.model';

const ORG_COLLECTION = 'organizations';
const INVITE_COLLECTION = 'invites';

class OrganizationRepository extends AbstractFirestoreRepository<Organization> {
  constructor() {
    super(ORG_COLLECTION, {
      schema: OrganizationSchema,
      softDeleteEnabled: true,
      enableVersioning: true,
    });
  }

  /**
   * Returns a repository for the members sub-collection of a specific organization.
   * Path: organizations/{orgId}/members
   */
  members(orgId: string) {
    return this.subCollection<Member>(orgId, 'members', {
      schema: MemberSchema,
      softDeleteEnabled: true,
    });
  }
}

class InviteRepository extends AbstractFirestoreRepository<Invite> {
  constructor() {
    super(INVITE_COLLECTION, {
      schema: InviteSchema,
      softDeleteEnabled: true,
    });
  }

  async findByToken(token: string): Promise<Invite | null> {
    const { data } = await this.list({
      where: [
        { field: 'token', op: '==', value: token },
        { field: 'status', op: '==', value: 'PENDING' },
      ],
      limit: 1,
    });

    const invite = data[0];
    if (!invite) return null;
    if (invite.expiresAt < new Date()) return null;
    return invite;
  }

  async findByEmail(email: string): Promise<Invite[]> {
    const { data } = await this.list({
      where: [
        { field: 'email', op: '==', value: email },
        { field: 'status', op: '==', value: 'PENDING' },
      ],
      limit: 10,
    });
    
    // Filter out expired invites
    const now = new Date();
    return data.filter(invite => invite.expiresAt > now);
  }

  async existsActiveInvite(orgId: string, email: string): Promise<boolean> {
    const { data } = await this.list({
      where: [
        { field: 'orgId', op: '==', value: orgId },
        { field: 'email', op: '==', value: email },
        { field: 'status', op: '==', value: 'PENDING' },
      ],
      limit: 1,
    });
    return data.length > 0;
  }
}

export const organizationRepository = new OrganizationRepository();
export const inviteRepository = new InviteRepository();
