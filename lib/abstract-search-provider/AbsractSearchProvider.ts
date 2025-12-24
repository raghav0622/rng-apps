// core/lib/search/AbstractSearchProvider.ts
import { SearchResult } from '../firestore-repository/types';

/**
 * Interface for full-text search engines (Algolia, MeiliSearch, Elasticsearch).
 * Ensures consistency in how we index and query data across the application.
 */
export abstract class AbstractSearchProvider {
  /**
   * Adds or updates a document in the search index.
   * **Important:** Must ensure `orgId` is included in the record for tenant isolation.
   *
   * @template T
   * @param {string} collectionId - The name of the collection/index.
   * @param {string} id - The unique document ID.
   * @param {T} data - The data payload to index.
   */
  abstract index<T>(collectionId: string, id: string, data: T): Promise<void>;

  /**
   * Removes a document from the search index.
   *
   * @param {string} collectionId - The name of the collection/index.
   * @param {string} id - The unique document ID to remove.
   */
  abstract remove(collectionId: string, id: string): Promise<void>;

  /**
   * Performs a search query scoped to a specific tenant.
   *
   * @template T
   * @param {string} collectionId - The name of the collection/index.
   * @param {string} query - The search string.
   * @param {Object} options - Search options.
   * @param {string} options.orgId - **Mandatory** organization ID for security.
   * @param {number} [options.limit] - Max results to return.
   * @param {string} [options.filters] - Advanced filter string (provider specific).
   * @returns {Promise<SearchResult<T>>} Standardized search results.
   */
  abstract search<T>(
    collectionId: string,
    query: string,
    options: { orgId: string; limit?: number; filters?: string },
  ): Promise<SearchResult<T>>;

  /**
   * Batch indexes multiple documents. Useful for migrations or initial seeding.
   *
   * @template T
   * @param {string} collectionId - The index name.
   * @param {Array<{ id: string; data: T }>} items - List of items to index.
   */
  abstract bulkIndex<T>(collectionId: string, items: { id: string; data: T }[]): Promise<void>;
}
