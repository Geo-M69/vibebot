export interface StoreHandle {
    getAll(): Promise<Record<string, any>>;
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    remove(key: string): Promise<void>;
}

export function createStore(name: string): StoreHandle;
export function flushAll(): Promise<void>;
