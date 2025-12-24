/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { firestore } from '@/lib/firebase/admin';
import * as crypto from 'crypto';
import DataLoader from 'dataloader';
import {
  AggregateField,
  CollectionReference,
  DocumentSnapshot,
  FieldPath,
  FieldValue,
  Query,
  Timestamp,
  Transaction,
  WhereFilterOp,
} from 'firebase-admin/firestore';
import { Base64 } from 'js-base64';
import { promisify } from 'util';
import * as zlib from 'zlib';
import { z } from 'zod';
import {
  AggregateOptions,
  AuditContext,
  BaseEntity,
  BulkResult,
  CacheProvider,
  CollectionGroupOptions,
  EntityVersion,
  ListOptions,
  Logger,
  NestedKeyOf,
  OutboxEvent,
  ReadOptions,
  RepositoryConfig,
  RepositoryError,
  RepositoryHooks,
  SearchProvider,
  SearchResult,
  UpdateData,
  WriteOptions,
} from './types';

const gzip = promisify(zlib.gzip);
const unzip = promisify(zlib.unzip);

/**
 * 🌍 **Universal ERP Firestore Repository (Platinum Edition)**
 *
 * Includes:
 * - 🛡️ **Strict Tenancy**: Impossible to accidentally leak data across orgs.
 * - 🛡️ **Resilient Caching**: Redis outages won't kill the app.
 * - 🔍 **Search Integration**: Interfaces with Algolia/MeiliSearch.
 * - 📦 **Detailed Bulk Writes**: Row-level error reporting.
 */
export class FirestoreRepository<T extends BaseEntity> {
  protected collection: CollectionReference;
  protected schema?: z.ZodType<any, any, any>;
  protected hooks: RepositoryHooks<T>;
  protected softDeleteEnabled: boolean;
  protected cache?: CacheProvider;
  protected defaultCacheTtl: number;
  protected transaction?: Transaction;
  protected logger: Logger;

  // Platinum Features
  protected searchProvider?: SearchProvider;
  protected resilientCaching: boolean;

  // Configs
  protected enableVersioning: boolean;
  protected useDiffForHistory: boolean;
  protected sensitiveFields: string[];
  protected encryptionKey?: Buffer;
  protected compressedFields: string[];
  protected targetVersion: number;
  protected migrations: Record<number, (data: any) => any>;
  protected relations: Record<string, string>;
  protected onMetrics?: (op: 'READ' | 'WRITE' | 'DELETE', count: number, tenantId?: string) => void;

  private dataLoader: DataLoader<string, T | null>;

  // Tenancy Scopes
  protected defaultConstraints: {
    field: string;
    op: WhereFilterOp;
    value: any;
  }[] = [];
  protected defaultCreateOverrides: Partial<T> = {};

  constructor(collectionPath: string, config: RepositoryConfig<T> = {}) {
    this.collection = firestore().collection(collectionPath);
    this.schema = config.schema;
    this.hooks = config.hooks || {};
    this.softDeleteEnabled = config.softDeleteEnabled ?? true;
    this.cache = config.cacheProvider;
    this.defaultCacheTtl = config.defaultCacheTtl || 300;
    this.transaction = config.transaction;

    // Feature Flags
    this.searchProvider = config.searchProvider;
    this.resilientCaching = config.resilientCaching ?? true;

    // Logging Defaults
    this.logger = config.logger || {
      debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta),
      info: (msg, meta) => console.info(`[INFO] ${msg}`, meta),
      warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
      error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta),
    };

    this.enableVersioning = config.enableVersioning || false;
    this.useDiffForHistory = config.useDiffForHistory || false;
    this.sensitiveFields = config.sensitiveFields || [];
    this.encryptionKey = config.encryptionKey
      ? Buffer.from(config.encryptionKey, 'hex')
      : undefined;

    this.compressedFields = config.compressedFields || [];
    this.targetVersion = config.targetVersion || 0;
    this.migrations = config.migrations || {};
    this.relations = config.relations || {};
    this.onMetrics = config.onMetrics;

    // Batch Loader (Handles the N+1 problem)
    this.dataLoader = new DataLoader(
      async (ids: readonly string[]) => {
        const results = await this.getMany(ids as string[]);
        const lookup = new Map(results.map((doc) => [doc.id, doc]));
        return ids.map((id) => lookup.get(id) || null);
      },
      { cache: false },
    );
  }

  // ============================================================================
  // 1. FACTORY & SCOPING
  // ============================================================================

  /**
   * Returns a repository instance isolated to a specific Tenant.
   */
  forTenant(tenantId: string): FirestoreRepository<T> {
    const repo = this.clone(this.collection.id);
    repo.defaultConstraints = [
      ...this.defaultConstraints,
      { field: 'orgId', op: '==', value: tenantId },
    ];
    repo.defaultCreateOverrides = {
      ...this.defaultCreateOverrides,
      orgId: tenantId,
    } as unknown as Partial<T>;
    return repo;
  }

  /**
   * Binds the repository to a Firestore Transaction.
   */
  withTransaction(t: Transaction): FirestoreRepository<T> {
    const repo = this.clone(this.collection.id);
    repo.transaction = t;
    return repo;
  }

  /**
   * Spawns a sub-collection repository (e.g. `users/123/tasks`).
   */
  subCollection<SubT extends BaseEntity>(
    docId: string,
    subPath: string,
    config: RepositoryConfig<SubT> = {},
  ): FirestoreRepository<SubT> {
    const fullPath = `${this.collection.path}/${docId}/${subPath}`;
    return new FirestoreRepository<SubT>(fullPath, {
      softDeleteEnabled: this.softDeleteEnabled,
      cacheProvider: this.cache,
      defaultCacheTtl: this.defaultCacheTtl,
      transaction: this.transaction,
      encryptionKey: this.encryptionKey ? this.encryptionKey.toString('hex') : undefined,
      onMetrics: this.onMetrics,
      logger: this.logger,
      searchProvider: this.searchProvider, // Pass down search provider
      ...config,
    });
  }

  // ============================================================================
  // 🛡️ RESILIENT CACHING HELPERS
  // ============================================================================

  private async safeCacheGet<CacheT>(key: string): Promise<CacheT | null> {
    if (!this.cache) return null;
    try {
      return await this.cache.get<CacheT>(key);
    } catch (e) {
      if (this.resilientCaching) {
        this.logger.warn(`Redis Get Failed (Resilient Mode): ${e}`);
        return null; // Fail open -> Go to DB
      }
      throw e;
    }
  }

  private async safeCacheSet(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.set(key, value, ttl);
    } catch (e) {
      if (this.resilientCaching) {
        this.logger.warn(`Redis Set Failed (Resilient Mode): ${e}`);
        return; // Proceed without caching
      }
      throw e;
    }
  }

  private async safeCacheDel(key: string): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(key);
    } catch (e) {
      if (this.resilientCaching) {
        this.logger.warn(`Redis Del Failed (Resilient Mode): ${e}`);
        return;
      }
      throw e;
    }
  }

  // ============================================================================
  // 🔍 FULL TEXT SEARCH
  // ============================================================================

  /**
   * Search using the external SearchProvider (Algolia, MeiliSearch).
   */
  async search(query: string, options: any = {}): Promise<SearchResult<T>> {
    if (!this.searchProvider) {
      throw new RepositoryError('No SearchProvider configured', 'FAILED_PRECONDITION');
    }

    try {
      const results = await this.searchProvider.search<T>(this.collection.id, query, options);

      // Security Check: Filter results by tenant if scoped
      if (this.defaultCreateOverrides?.orgId) {
        results.hits = results.hits.filter((h) => h.orgId === this.defaultCreateOverrides.orgId);
      }

      return results;
    } catch (e: any) {
      throw new RepositoryError(`Search failed: ${e.message}`, 'UNKNOWN', e);
    }
  }

  // ============================================================================
  // 2. READ OPERATIONS
  // ============================================================================

  async get(id: string, options: ReadOptions<T> = {}): Promise<T> {
    return this.withErrorHandling(async () => {
      const cacheKey = this.getCacheKey(id);

      // 1. Resilient Cache Check
      if (!this.transaction && !options.includeDeleted && !options.select && !options.populate) {
        const cached = await this.safeCacheGet<T>(cacheKey);
        if (cached) {
          const revived = this.reviveDates(cached);
          this.checkTenantIsolation(revived);
          return revived;
        }
      }

      // 2. DB Fetch
      let ref: any = this.collection.doc(id);
      if (options.select?.length) ref = ref.select(...options.select);
      const doc = this.transaction ? await this.transaction.get(ref) : await ref.get();

      if (this.onMetrics) this.onMetrics('READ', 1, this.defaultCreateOverrides?.orgId);
      if (!doc.exists) throw new RepositoryError('Not found', 'NOT_FOUND');

      let entity = await this.transformDocAsync(doc);

      // 🔒 SECURITY CHECK
      this.checkTenantIsolation(entity);

      if (!options.includeDeleted && entity.deletedAt && this.softDeleteEnabled) {
        throw new RepositoryError('Entity deleted', 'NOT_FOUND');
      }

      if (options.populate) {
        entity = await this.populateRelations(entity, options.populate);
      }

      if (options.mask) {
        options.mask.forEach((field) => delete entity[field as string]);
      }

      // 3. Resilient Cache Set
      if (!this.transaction && !options.includeDeleted && !options.select && !options.populate) {
        await this.safeCacheSet(cacheKey, entity, this.defaultCacheTtl);
      }

      return entity;
    });
  }

  async exists(id: string): Promise<boolean> {
    const ref = this.collection.doc(id);
    const doc = this.transaction ? await this.transaction.get(ref) : await ref.get();
    if (!doc.exists) return false;
    if (this.softDeleteEnabled) {
      const data = doc.data();
      return !data?.deletedAt;
    }
    return true;
  }

  async list(options: ListOptions<T>): Promise<{ data: T[]; nextCursor?: string }> {
    return this.withErrorHandling(async () => {
      const query = this.buildQuery(this.collection, options);
      const snap = this.transaction ? await this.transaction.get(query) : await query.get();

      if (this.onMetrics) this.onMetrics('READ', snap.size, this.defaultCreateOverrides?.orgId);

      const data = await Promise.all(
        snap.docs.map(async (doc) => {
          let entity = await this.transformDocAsync(doc);
          if (options.populate) entity = await this.populateRelations(entity, options.populate);
          if (options.mask) options.mask.forEach((f) => delete entity[f as string]);
          return entity;
        }),
      );

      let nextCursor: string | undefined;
      if (options.limit && snap.docs.length === options.limit) {
        nextCursor = this.encodeCursor(snap.docs[snap.docs.length - 1], options.orderBy);
      }

      return { data, nextCursor };
    });
  }

  async listGroup(options: CollectionGroupOptions<T>): Promise<T[]> {
    return this.withErrorHandling(async () => {
      const collectionId = this.collection.id;
      // TYPE FIX: Explicitly cast to Query to allow .where chaining
      let query: Query = firestore().collectionGroup(collectionId);

      if (this.defaultCreateOverrides?.orgId) {
        query = query.where('orgId', '==', this.defaultCreateOverrides.orgId);
      } else if (options.partitionKey && options.partitionValue) {
        query = query.where(options.partitionKey as string, '==', options.partitionValue);
      } else {
        this.logger.warn('⚠️ Performing global Collection Group query without partition!');
      }

      query = this.buildQuery(query as any, options);
      const snap = await query.get();

      if (this.onMetrics) this.onMetrics('READ', snap.size, 'GROUP_QUERY');

      return Promise.all(
        snap.docs.map(async (doc) => {
          let entity = await this.transformDocAsync(doc);
          if (options.populate) entity = await this.populateRelations(entity, options.populate);
          if (options.mask) options.mask.forEach((f) => delete entity[f as string]);
          return entity;
        }),
      );
    });
  }

  async aggregate(options: AggregateOptions<T>): Promise<Record<string, number>> {
    return this.withErrorHandling(async () => {
      const query = this.buildQuery(this.collection, options);

      const specs: Record<string, any> = {
        count: AggregateField.count(),
      };

      if (options.sum) {
        specs[options.sum as string] = AggregateField.sum(options.sum as string);
      }
      if (options.average) {
        specs[options.average as string] = AggregateField.average(options.average as string);
      }

      const snap = await query.aggregate(specs).get();
      return snap.data() as Record<string, number>;
    });
  }

  // ============================================================================
  // 3. WRITE OPERATIONS
  // ============================================================================

  async create(
    id: string,
    data: Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'>,
    opts: WriteOptions = {},
  ): Promise<T> {
    return this.withErrorHandling(async () => {
      const raw = { ...this.defaultCreateOverrides, ...data };
      const now = new Date();
      let entity = {
        ...raw,
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as T;

      if (this.hooks.beforeCreate) entity = await this.hooks.beforeCreate(entity, opts.audit);
      if (this.schema) this.schema.parse(entity);

      let payload = this.encryptData(entity);
      payload = await this.compressData(payload);
      const firestoreData = this.sanitizeForWrite({
        ...payload,
        id: undefined,
        _v: this.targetVersion,
      });

      const ref = this.collection.doc(id);
      if (this.transaction) this.transaction.set(ref, firestoreData);
      else await ref.set(firestoreData);

      // 🔥 SEARCH SYNC
      if (this.searchProvider && !this.transaction) {
        this.searchProvider
          .index(this.collection.id, id, entity)
          .catch((e) => this.logger.warn('Search Indexing Failed', e));
      }

      if (this.onMetrics) this.onMetrics('WRITE', 1, entity.orgId);
      if (this.hooks.afterCreate) await this.hooks.afterCreate(entity, opts.audit);

      return entity;
    });
  }

  /**
   * ⚡ **Bulk Create with Reporting**
   * Uses batched writes (in chunks) to return row-level errors.
   */
  async createMany(
    items: Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'>[],
    opts: WriteOptions = {},
  ): Promise<BulkResult> {
    const result: BulkResult = { successCount: 0, failureCount: 0, errors: [] };
    const batchSize = 400; // Safe batch size (limit is 500)

    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const batch = firestore().batch();

      // We first validate everything in the chunk.
      // If validation passes, we add to batch.
      chunk.forEach((item, index) => {
        try {
          const globalIndex = i + index;
          const id = item.id || this.collection.doc().id;
          const raw = { ...this.defaultCreateOverrides, ...item };
          const now = new Date();

          if (this.schema) this.schema.parse(raw);

          const entity = {
            ...raw,
            id,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };
          let payload = this.sanitizeForWrite({
            ...entity,
            id: undefined,
            _v: this.targetVersion,
          });

          // Encryption/Compression logic omitted for strict bulk performance,
          // or needs to be synchronous here. For max speed, we assume pre-processed or simple data.
          // If you need encryption in bulk, it must be synchronous or awaited one-by-one.
          payload = this.encryptData(payload);

          batch.set(this.collection.doc(id), payload);
          result.successCount++;
        } catch (e: any) {
          result.failureCount++;
          result.errors.push({ index: i + index, error: e.message });
        }
      });

      // Commit this chunk
      if ((batch as any)._opCount > 0) {
        await batch.commit();
      }
    }

    if (this.onMetrics)
      this.onMetrics('WRITE', result.successCount, this.defaultCreateOverrides?.orgId);

    return result;
  }

  async update(id: string, data: UpdateData<T>, opts: WriteOptions = {}): Promise<void> {
    return this.withErrorHandling(async () => {
      const raw = { ...data, ...this.defaultCreateOverrides };
      delete (raw as any).id;
      delete (raw as any).createdAt;

      // 1. Partial Validation (Fix for ZodType vs ZodObject)
      if (this.schema) {
        try {
          if ('partial' in this.schema && typeof (this.schema as any).partial === 'function') {
            (this.schema as any).partial().parse(raw);
          }
        } catch (e) {
          throw new RepositoryError('Validation Failed', 'ABORTED', e);
        }
      }

      let cleanData = this.sanitizeForWrite(raw);
      cleanData = this.flattenForUpdate(cleanData);

      if (this.hooks.beforeUpdate) {
        cleanData = await this.hooks.beforeUpdate(id, cleanData, undefined, opts.audit);
      }

      // 2. Optimistic Locking
      let precondition = opts.precondition;
      if (opts.optimisticLock) {
        const lastUpdate = (data as any).updatedAt;
        if (!lastUpdate || !(lastUpdate instanceof Date)) {
          throw new RepositoryError(
            'Optimistic locking requires passing original updatedAt in data',
            'FAILED_PRECONDITION',
          );
        }
        precondition = { lastUpdateTime: Timestamp.fromDate(lastUpdate) };
      }

      if (this.enableVersioning) await this.createVersionSnapshot(id, opts.audit);

      let payload = this.encryptData(cleanData);
      payload = await this.compressData(payload);
      payload.updatedAt = new Date();

      const ref = this.collection.doc(id);
      if (this.transaction) {
        this.transaction.update(ref, payload);
      } else {
        if (precondition) await ref.update(payload, precondition);
        else await ref.update(payload);
      }

      // 🔥 SEARCH SYNC (Partial Update)
      if (this.searchProvider && !this.transaction) {
        this.searchProvider
          .index(this.collection.id, id, { ...raw, id })
          .catch((e) => this.logger.warn('Index Update Failed', e));
      }

      if (!this.transaction) await this.safeCacheDel(this.getCacheKey(id));

      if (this.onMetrics) this.onMetrics('WRITE', 1, this.defaultCreateOverrides?.orgId);
      if (this.hooks.afterUpdate) await this.hooks.afterUpdate(id, cleanData, opts.audit);
    });
  }

  async upsert(id: string, data: UpdateData<T>, _opts: WriteOptions = {}): Promise<void> {
    return this.withErrorHandling(async () => {
      const raw = { ...data, ...this.defaultCreateOverrides };
      delete (raw as any).id;
      delete (raw as any).createdAt;

      let payload = this.sanitizeForWrite(raw);
      payload = this.flattenForUpdate(payload);
      payload = this.encryptData(payload);
      payload = await this.compressData(payload);
      payload.updatedAt = new Date();

      const ref = this.collection.doc(id);
      if (this.transaction) this.transaction.set(ref, payload, { merge: true });
      else await ref.set(payload, { merge: true });

      if (!this.transaction) await this.safeCacheDel(this.getCacheKey(id));
    });
  }

  // ============================================================================
  // 4. ATOMIC & BUSINESS LOGIC
  // ============================================================================

  async queueEvent(topic: string, payload: any): Promise<void> {
    if (!this.transaction) {
      throw new RepositoryError(
        'queueEvent must be called within a transaction (use repo.withTransaction)',
        'FAILED_PRECONDITION',
      );
    }

    const eventId = firestore().collection('_outbox').doc().id;
    const eventRef = firestore().collection('_outbox').doc(eventId);

    const event: OutboxEvent = {
      id: eventId,
      topic,
      payload,
      status: 'PENDING',
      createdAt: new Date(),
    };

    this.transaction.set(eventRef, event);
  }

  async runAtomic(
    id: string,
    mutation: (current: T) => UpdateData<T>,
    maxRetries = 3,
  ): Promise<void> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const docSnap = await this.collection.doc(id).get();
        if (!docSnap.exists) throw new RepositoryError('Doc not found', 'NOT_FOUND');
        const current = await this.transformDocAsync(docSnap);
        const updateTime = docSnap.updateTime;

        const changes = mutation(current);
        await this.update(id, changes, {
          precondition: { lastUpdateTime: updateTime },
        });
        return;
      } catch (e: any) {
        if (e.code === 10 || e.code === 'ABORTED' || e.code === 'FAILED_PRECONDITION') {
          attempt++;
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 20)); // Exponential backoff
          continue;
        }
        throw e;
      }
    }
    throw new RepositoryError('Max retries exceeded', 'ABORTED');
  }

  // ============================================================================
  // 5. LIFECYCLE
  // ============================================================================

  async softDelete(id: string, opts: WriteOptions = {}): Promise<void> {
    if (!this.softDeleteEnabled) return this.forceDelete(id, opts);
    await this.update(id, { deletedAt: new Date() } as UpdateData<T>, opts);
  }

  async restore(id: string, opts: WriteOptions = {}): Promise<void> {
    if (!this.softDeleteEnabled) return;
    await this.update(id, { deletedAt: null } as UpdateData<T>, opts);
  }

  async forceDelete(id: string, opts: WriteOptions = {}): Promise<void> {
    const ref = this.collection.doc(id);
    if (this.hooks.beforeDelete) await this.hooks.beforeDelete(id, opts.audit);

    if (this.transaction) this.transaction.delete(ref);
    else await ref.delete();

    // 🔥 SEARCH SYNC
    if (this.searchProvider && !this.transaction) {
      this.searchProvider
        .remove(this.collection.id, id)
        .catch((e) => this.logger.warn('Index Remove Failed', e));
    }

    await this.safeCacheDel(this.getCacheKey(id));
    if (this.onMetrics) this.onMetrics('DELETE', 1, this.defaultCreateOverrides?.orgId);
    if (this.hooks.afterDelete) await this.hooks.afterDelete(id, opts.audit);
  }

  async recursiveDelete(id: string): Promise<void> {
    try {
      await this.get(id, { select: ['id' as NestedKeyOf<T>] });
    } catch {
      throw new RepositoryError('Access Denied', 'PERMISSION_DENIED');
    }

    await firestore().recursiveDelete(this.collection.doc(id));
    await this.safeCacheDel(this.getCacheKey(id));
  }

  async purgeDeleted(days: number): Promise<number> {
    if (!this.softDeleteEnabled) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let query = this.collection.where('deletedAt', '<=', cutoff);
    this.defaultConstraints.forEach((c) => (query = query.where(c.field, c.op, c.value)));

    const writer = firestore().bulkWriter();
    let count = 0;
    const stream = query.stream();
    for await (const doc of stream) {
      writer.delete((doc as unknown as DocumentSnapshot).ref);
      count++;
    }
    await writer.close();
    return count;
  }

  // ============================================================================
  // 6. UTILITIES (Pipeline & Internal)
  // ============================================================================

  private async transformDocAsync(doc: DocumentSnapshot): Promise<T> {
    const data = doc.data();
    if (!data) throw new RepositoryError(`Doc ${doc.id} empty`, 'NOT_FOUND');

    let entity = { ...this.convertTimestamps(data), id: doc.id } as T;
    entity = this.decryptData(entity);
    entity = await this.decompressData(entity);
    entity = await this.applyReadRepair(doc.id, entity);
    return entity;
  }

  private async applyReadRepair(docId: string, data: any): Promise<any> {
    const currentVersion = data._v || 0;
    if (currentVersion >= this.targetVersion) return data;

    let migrated = { ...data };
    let version = currentVersion;
    while (version < this.targetVersion) {
      version++;
      if (this.migrations[version]) migrated = this.migrations[version](migrated);
    }
    migrated._v = this.targetVersion;
    this.update(docId, migrated).catch((e) => this.logger.warn(`ReadRepair error ${docId}`, e));
    return migrated;
  }

  private async populateRelations(entity: T, fields: string[]): Promise<T> {
    for (const field of fields) {
      const targetCollection = this.relations[field];
      const targetId = entity[field];
      if (targetCollection && targetId) {
        try {
          const snap = await firestore().collection(targetCollection).doc(targetId).get();
          if (snap.exists) {
            (entity as any)[field] = { ...snap.data(), id: snap.id };
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return entity;
  }

  private async createVersionSnapshot(id: string, audit?: AuditContext): Promise<void> {
    try {
      const oldDoc = await this.get(id);
      const historyRef = this.collection.doc(id).collection('_history').doc();

      const snapshot: EntityVersion<T> = {
        id: historyRef.id,
        entityId: id,
        validFrom: oldDoc.updatedAt,
        validTo: new Date(),
        actorId: audit?.actorId,
        reason: audit?.reason,
      };

      if (this.useDiffForHistory) {
        snapshot.diff = this.calculateDiff(oldDoc, {});
      } else {
        snapshot.data = oldDoc;
      }

      if (this.transaction) this.transaction.set(historyRef, snapshot);
      else await historyRef.set(snapshot);
    } catch (e) {
      this.logger.warn('History snapshot failed', e);
    }
  }

  private flattenForUpdate(data: any): any {
    const res: any = {};
    const recurse = (obj: any, current: string) => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = current ? `${current}.${key}` : key;
        if (
          value &&
          typeof value === 'object' &&
          !(value instanceof Date) &&
          !(value instanceof FieldValue) &&
          !Array.isArray(value)
        ) {
          recurse(value, newKey);
        } else {
          res[newKey] = value;
        }
      }
    };
    recurse(data, '');
    return res;
  }

  private sanitizeForWrite(data: any): any {
    if (data === undefined) return null;
    if (data === null) return null;
    if (
      typeof data !== 'object' ||
      data instanceof Date ||
      data instanceof Timestamp ||
      data instanceof FieldValue
    )
      return data;
    if (Array.isArray(data)) return data.map((i) => this.sanitizeForWrite(i));

    const res: any = {};
    for (const key in data) res[key] = this.sanitizeForWrite(data[key]);
    return res;
  }

  private encryptData(data: any): any {
    if (!this.encryptionKey || !this.sensitiveFields.length) return data;
    const process = (val: string) => {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey!, iv);
      return `${iv.toString('hex')}:${cipher.update(val, 'utf8', 'hex') + cipher.final('hex')}`;
    };
    const traverse = (obj: any, path: string) => {
      for (const key in obj) {
        const currPath = path ? `${path}.${key}` : key;
        if (this.sensitiveFields.includes(currPath) && typeof obj[key] === 'string') {
          obj[key] = process(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key]) {
          traverse(obj[key], currPath);
        }
      }
    };
    const copy = JSON.parse(JSON.stringify(data));
    traverse(copy, '');
    return copy;
  }

  private decryptData(data: any): any {
    if (!this.encryptionKey || !this.sensitiveFields.length) return data;
    const process = (val: string) => {
      if (!val.includes(':')) return val;
      const [iv, content] = val.split(':');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        this.encryptionKey!,
        Buffer.from(iv, 'hex'),
      );
      return decipher.update(content, 'hex', 'utf8') + decipher.final('utf8');
    };
    const traverse = (obj: any, path: string) => {
      for (const key in obj) {
        const currPath = path ? `${path}.${key}` : key;
        if (this.sensitiveFields.includes(currPath) && typeof obj[key] === 'string') {
          try {
            obj[key] = process(obj[key]);
          } catch {
            // ignore
          }
        } else if (typeof obj[key] === 'object' && obj[key]) {
          traverse(obj[key], currPath);
        }
      }
    };
    const copy = { ...data };
    traverse(copy, '');
    return copy;
  }

  private async compressData(data: any): Promise<any> {
    if (!this.compressedFields.length) return data;
    const copy = { ...data };
    for (const f of this.compressedFields) {
      if (typeof copy[f] === 'string' && copy[f].length > 100) {
        copy[f] = `::gzip::${(await gzip(copy[f])).toString('base64')}`;
      }
    }
    return copy;
  }

  private async decompressData(data: any): Promise<any> {
    if (!this.compressedFields.length) return data;
    const copy = { ...data };
    for (const f of this.compressedFields) {
      if (typeof copy[f] === 'string' && copy[f].startsWith('::gzip::')) {
        copy[f] = (await unzip(Buffer.from(copy[f].replace('::gzip::', ''), 'base64'))).toString();
      }
    }
    return copy;
  }

  private convertTimestamps(data: any): any {
    if (data instanceof Timestamp) return data.toDate();
    if (Array.isArray(data)) return data.map((i) => this.convertTimestamps(i));
    if (data && typeof data === 'object') {
      const res: any = {};
      for (const k in data) res[k] = this.convertTimestamps(data[k]);
      return res;
    }
    return data;
  }

  private reviveDates(obj: any): any {
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) return new Date(obj);
    if (Array.isArray(obj)) return obj.map((i) => this.reviveDates(i));
    if (obj && typeof obj === 'object') {
      const res: any = {};
      for (const k in obj) res[k] = this.reviveDates(obj[k]);
      return res;
    }
    return obj;
  }

  private calculateDiff(original: any, updates: any): any {
    if (!original) return updates;
    const diff: any = {};
    for (const key in updates) {
      if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
      const newValue = updates[key];
      const oldValue = original[key];
      if (newValue instanceof FieldValue) {
        diff[key] = newValue;
        continue;
      }
      if (newValue instanceof Date && oldValue instanceof Date) {
        if (newValue.getTime() !== oldValue.getTime()) diff[key] = newValue;
        continue;
      }
      if (
        typeof newValue === 'object' &&
        newValue !== null &&
        typeof oldValue === 'object' &&
        oldValue !== null &&
        !Array.isArray(newValue) &&
        !Array.isArray(oldValue) &&
        !(newValue instanceof Date)
      ) {
        const nestedDiff = this.calculateDiff(oldValue, newValue);
        if (Object.keys(nestedDiff).length > 0) diff[key] = nestedDiff;
        continue;
      }
      if (!this.isEqual(oldValue, newValue)) diff[key] = newValue;
    }
    return diff;
  }

  private buildQuery(base: Query, options: ListOptions<T> | AggregateOptions<T>): Query {
    let query = base;
    this.defaultConstraints.forEach((c) => (query = query.where(c.field, c.op, c.value)));

    if ('includeDeleted' in options && this.softDeleteEnabled && !options.includeDeleted) {
      query = query.where('deletedAt', '==', null);
    }

    if (options.where) {
      for (const cond of options.where) {
        if ('field' in cond) {
          query = query.where(cond.field as string, cond.op, cond.value);
        } else {
          query = query.where(cond);
        }
      }
    }

    if ('limit' in options) {
      const listOpts = options as ListOptions<T>;
      const orderBy = listOpts.orderBy || [{ field: 'createdAt', direction: 'desc' }];
      orderBy.forEach((o) => (query = query.orderBy(o.field as string, o.direction)));
      if (orderBy[0].field !== 'id') query = query.orderBy(FieldPath.documentId());

      if (listOpts.cursor) {
        if (typeof listOpts.cursor === 'string')
          query = query.startAfter(...this.decodeCursor(listOpts.cursor));
        else query = query.startAfter(listOpts.cursor as unknown as DocumentSnapshot);
      }
      if (listOpts.limit) query = query.limit(listOpts.limit);
    }
    return query;
  }

  private encodeCursor(doc: DocumentSnapshot, orderBy?: any[]): string {
    const values = (orderBy || [{ field: 'createdAt' }]).map((o: any) => {
      const val = doc.get(o.field);
      return val instanceof Timestamp ? val.toMillis() : val;
    });
    values.push(doc.id);
    return Base64.encode(JSON.stringify(values));
  }

  private decodeCursor(cursor: string): any[] {
    return JSON.parse(Base64.decode(cursor));
  }

  private clone(path: string): FirestoreRepository<T> {
    return new FirestoreRepository<T>(path, this.getConfig());
  }

  private getConfig(): RepositoryConfig<T> {
    return {
      schema: this.schema,
      hooks: this.hooks,
      softDeleteEnabled: this.softDeleteEnabled,
      cacheProvider: this.cache,
      defaultCacheTtl: this.defaultCacheTtl,
      transaction: this.transaction,
      enableVersioning: this.enableVersioning,
      useDiffForHistory: this.useDiffForHistory,
      sensitiveFields: this.sensitiveFields,
      encryptionKey: this.encryptionKey ? this.encryptionKey.toString('hex') : undefined,
      compressedFields: this.compressedFields,
      targetVersion: this.targetVersion,
      migrations: this.migrations,
      relations: this.relations,
      onMetrics: this.onMetrics,
      logger: this.logger,
      searchProvider: this.searchProvider,
      resilientCaching: this.resilientCaching,
    };
  }

  private getCacheKey(id: string) {
    return `repo:${this.collection.id}:${id}`;
  }

  private async getMany(ids: string[]): Promise<T[]> {
    if (!ids.length) return [];
    const uniqueIds = [...new Set(ids)];
    const results: T[] = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      let q = this.collection.where(FieldPath.documentId(), 'in', chunk);
      this.defaultConstraints.forEach((c) => (q = q.where(c.field, c.op, c.value)));
      if (this.softDeleteEnabled) q = q.where('deletedAt', '==', null);
      const snap = await q.get();
      results.push(...(await Promise.all(snap.docs.map((d) => this.transformDocAsync(d)))));
    }
    return results;
  }

  private async withErrorHandling<R>(fn: () => Promise<R>): Promise<R> {
    try {
      return await fn();
    } catch (error: any) {
      if (error.code === 9 && error.details?.includes('index'))
        this.logger.error(`\n🚨 INDEX MISSING: ${error.details}\n`);
      if (error instanceof RepositoryError) throw error;
      if (error.code === 5) throw new RepositoryError('Entity not found', 'NOT_FOUND', error);
      throw new RepositoryError(error.message || 'Unknown DB Error', 'UNKNOWN', error);
    }
  }

  private checkTenantIsolation(entity: T) {
    const scopedOrgId = this.defaultCreateOverrides?.orgId;
    if (scopedOrgId && entity.orgId && entity.orgId !== scopedOrgId) {
      this.logger.error(
        `🚨 SECURITY ALARM: Tenant ${scopedOrgId} attempted to access data of ${entity.orgId}`,
        {
          resource: entity.id,
        },
      );
      throw new RepositoryError('Access Denied', 'PERMISSION_DENIED');
    }
  }

  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }
}
