import { FirestoreRepository } from '@/lib/firestore-repository/firestore-repository';
import { Organization, OrganizationSchema } from './org.model';

const COLLECTION_PATH = 'organizations';

class OrganizationRepository extends FirestoreRepository<Organization> {
  constructor() {
    super(COLLECTION_PATH, {
      schema: OrganizationSchema,
      softDeleteEnabled: true,
      enableVersioning: true,
    });
  }
}

export const organizationRepository = new OrganizationRepository();
