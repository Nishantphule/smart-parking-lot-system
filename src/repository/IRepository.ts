/**
 * Generic repository interface
 * Supports both sync (in-memory) and async (database) operations
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null> | T | null;
  findAll(): Promise<T[]> | T[];
  save(entity: T): Promise<T> | Promise<void> | void;
  delete(id: string): Promise<boolean> | boolean;
  exists(id: string): Promise<boolean> | boolean;
}
