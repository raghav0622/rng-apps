import { FirestoreRepository } from '@/lib/firestore-repository/firestore-repository';
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

class OrganizationRepository extends FirestoreRepository<Organization> {
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

class InviteRepository extends FirestoreRepository<Invite> {
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
