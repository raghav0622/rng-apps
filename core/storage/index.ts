/**
 * Storage module exports
 * 
 * Provides file storage capabilities through AbstractStorageProvider
 */

export { FirebaseStorageProvider, storageProvider } from './FirebaseStorageProvider';
export {
  AbstractStorageProvider,
  type StorageMetadata,
} from '../abstract-storage-provider/AbstractStorageProvider';
