// core/lib/search/AbstractSearchProvider.ts
import { SearchResult } from '../firestore-repository/types';

export abstract class AbstractSearchProvider {
  /**
   * Index a document.
   * Implementation must ensure orgId is included for multi-tenancy.
   */
  abstract index<T>(collectionId: string, id: string, data: T): Promise<void>;

  /**
   * Remove a document from the index.
   */
  abstract remove(collectionId: string, id: string): Promise<void>;

  /**
   * Perform a search scoped to a tenant.
   */
  abstract search<T>(
    collectionId: string,
    query: string,
    options: { orgId: string; limit?: number; filters?: string },
  ): Promise<SearchResult<T>>;

  /**
   * Bulk index for migrations or initial sync.
   */
  abstract bulkIndex<T>(collectionId: string, items: { id: string; data: T }[]): Promise<void>;
}
