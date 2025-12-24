import {
  DocumentSnapshot,
  FieldValue,
  Filter,
  Precondition,
  Transaction,
  WhereFilterOp,
} from 'firebase-admin/firestore';
import { z } from 'zod';

// ==========================================
// 1. Base Entity & Domain Types
// ==========================================

/**
 * The base interface for all ERP entities (Invoices, Users, Products).
 * All domain models **must** extend this interface.
 */
export interface BaseEntity {
  /** The Firestore Document ID */
  id: string;
  /** Creation timestamp (managed automatically) */
  createdAt: Date;
  /** Last update timestamp (managed automatically) */
  updatedAt: Date;
  /** Soft-delete timestamp. If set, the record is considered deleted. */
  deletedAt?: Date | null;
  /** Schema Version for Read-Repair (Auto-Migration) */
  _v?: number;
  /** Tenant ID for strict isolation in multi-tenant environments */
  orgId?: string;
  /** Index signature to allow dynamic fields */
  [key: string]: any;
}

/**
 * Structure of a History/Audit Document.
 * Stored in `_history` sub-collection.
 */
export interface EntityVersion<T> {
  id: string;
  entityId: string;
  /** Full data snapshot (optional if diff is used) */
  data?: T;
  /** Only the fields that changed */
  diff?: Partial<T>;
  validFrom: Date;
  validTo?: Date;
  actorId?: string;
  reason?: string;
}

/**
 * Structure for Transactional Outbox Events.
 * Used to guarantee side-effects (emails, webhooks) happen only if DB write succeeds.
 */
export interface OutboxEvent {
  id: string;
  topic: string; // e.g., 'invoice.created'
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

// ==========================================
// 2. Configuration & Infrastructure
// ==========================================

/**
 * Interface for injecting a custom logger (e.g., Pino, Winston).
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

/**
 * Interface for Full-Text Search Providers (e.g. Algolia, MeiliSearch, Elastic)
 */
export interface SearchProvider {
  /**
   * Search for documents matching a query string.
   */
  search<T>(indexName: string, query: string, options?: any): Promise<SearchResult<T>>;

  /**
   * Sync a document to the search index.
   */
  index(indexName: string, id: string, data: any): Promise<void>;

  /**
   * Remove a document from the search index.
   */
  remove(indexName: string, id: string): Promise<void>;
}

export interface SearchResult<T> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
}

/**
 * Detailed result for bulk operations
 */
export interface BulkResult {
  successCount: number;
  failureCount: number;
  errors: { index: number; id?: string; error: string }[];
}

/**
 * Configuration passed to the Repository constructor.
 */
export interface RepositoryConfig<T> {
  /** Zod Schema for runtime validation of writes */
  schema?: z.ZodType<any, any, any>;

  /** Lifecycle hooks for side-effects */
  hooks?: RepositoryHooks<T>;

  /** Cache Provider (Redis) */
  cacheProvider?: CacheProvider;
  defaultCacheTtl?: number; // Seconds

  /**
   * If true, Redis errors are logged but do not crash the request.
   * Default: true
   */
  resilientCaching?: boolean;

  /** Transaction Context (for Atomic Writes) */
  transaction?: Transaction;

  /** Soft Delete behavior (Default: true) */
  softDeleteEnabled?: boolean;

  /** Custom Logger (Defaults to console) */
  logger?: Logger;

  /** External Search Provider for Fuzzy Search */
  searchProvider?: SearchProvider;

  // --- RELATIONAL ---
  /** Map of field names to Collection names for auto-population */
  relations?: Record<string, string>;

  // --- GOVERNANCE ---
  /** Enable automatic audit logging to `_history` */
  enableVersioning?: boolean;
  /** If true, saves only the diff in history instead of full snapshot */
  useDiffForHistory?: boolean;

  // --- SECURITY ---
  /** Fields to AES-256 encrypt at rest (e.g. ['ssn', 'bank.account']) */
  sensitiveFields?: string[];
  /** 32-byte hex key for encryption */
  encryptionKey?: string;

  // --- OPTIMIZATION ---
  /** Fields to Gzip compress (e.g. ['largePayload']) */
  compressedFields?: string[];
  /** Target Schema Version for Read-Repair */
  targetVersion?: number;
  /** Migration functions: { 1: (data) => newData } */
  migrations?: Record<number, (data: any) => any>;
  /** Callback for metering (Billing) */
  onMetrics?: (op: 'READ' | 'WRITE' | 'DELETE', count: number, tenantId?: string) => void;
}

export interface RepositoryHooks<T> {
  beforeCreate?: (data: T, ctx?: AuditContext) => Promise<T> | T;
  afterCreate?: (data: T, ctx?: AuditContext) => Promise<void> | void;
  beforeUpdate?: (
    id: string,
    data: UpdateData<T>,
    currentDoc?: T,
    ctx?: AuditContext,
  ) => Promise<UpdateData<T>> | UpdateData<T>;
  afterUpdate?: (id: string, data: UpdateData<T>, ctx?: AuditContext) => Promise<void> | void;
  beforeDelete?: (id: string, ctx?: AuditContext) => Promise<void> | void;
  afterDelete?: (id: string, ctx?: AuditContext) => Promise<void> | void;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  setNX(key: string, value: any, ttlSeconds: number): Promise<boolean>;
}

// ==========================================
// 3. Request Options
// ==========================================

export interface AuditContext {
  actorId: string; // User ID performing action
  ip?: string;
  reason?: string; // e.g., "Ticket #123"
  role?: string; // For Field Masking
  [key: string]: any;
}

export interface WriteOptions {
  audit?: AuditContext;
  precondition?: Precondition;
  /**
   * If true, performs an Optimistic Concurrency check.
   * Requires the update payload to contain the `updatedAt` timestamp of the document when it was read.
   */
  optimisticLock?: boolean;
}

export interface ReadOptions<T extends BaseEntity> {
  /** Fields to return (Projection) */
  select?: NestedKeyOf<T>[];
  /** Fields to hide based on role (Security) */
  mask?: NestedKeyOf<T>[];
  /** Fields to auto-populate from other collections */
  populate?: string[];
  includeDeleted?: boolean;
}

/**
 * Union type for simple WHERE clauses or Advanced OR/AND Filters.
 * FIX: Removed missing FilterOr/FilterAnd exports; used 'Filter' which covers them.
 */
export type FilterCondition<T> =
  | { field: NestedKeyOf<T> | string; op: WhereFilterOp; value: any }
  | Filter;

export interface ListOptions<T extends BaseEntity> extends ReadOptions<T> {
  /** Supports simple arrays OR advanced Filter.or() / Filter.and() */
  where?: FilterCondition<T>[];
  orderBy?: { field: NestedKeyOf<T> | string; direction?: 'asc' | 'desc' }[];
  limit?: number;
  cursor?: string | DocumentSnapshot;
}

export interface CollectionGroupOptions<T extends BaseEntity> extends ListOptions<T> {
  /**
   * STRICT security filter.
   * Required for Collection Group queries to prevent cross-tenant leaks unless explicitly globally admin.
   */
  partitionKey?: keyof T;
  partitionValue?: string;
}

export interface AggregateOptions<T extends BaseEntity> {
  where?: FilterCondition<T>[];
  sum?: keyof T;
  average?: keyof T;
}

/** Allows FieldValue (increment, arrayUnion) in updates */
export type UpdateData<T> = {
  [K in keyof T]?: T[K] | FieldValue;
} & { [key: string]: any };

/**
 * Recursive dot-notation helper
 * FIX: Removed 'extends object' constraint to solve "Type 'T' does not satisfy constraint" error.
 */
export type NestedKeyOf<ObjectType> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export class RepositoryError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_FOUND'
      | 'ALREADY_EXISTS'
      | 'PERMISSION_DENIED'
      | 'ABORTED'
      | 'UNKNOWN'
      | 'FAILED_PRECONDITION',
    public originalError?: any,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
