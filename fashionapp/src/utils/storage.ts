import type { User } from '../types/auth';
import type { Product } from '../types/product';

const STORAGE_KEYS = {
    access_token: 'access_token',
    user: 'user',
    recently_viewed: 'recently_viewed'
} as const


export const accessTokenStorage = {
    save: (token: string): void => {
        try{
            localStorage.setItem(STORAGE_KEYS.access_token, token)
        }catch(e){
            console.error('Error saving access token', e)
        }
    },
    get: (): string | null => {
        try{
            return localStorage.getItem(STORAGE_KEYS.access_token)
        }catch(e){
            console.error('Error getting access token', e)
            return null
        }
    },
    remove: (): void => {
        try{
            localStorage.removeItem(STORAGE_KEYS.access_token)
        }catch(e){
            console.error('Error removing access token', e)
        }
    }
}

export const userStorage = {
    save: (user: User): void => {
        try{
            localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
        }catch(e){
            console.error('Error saving user', e)
        }
    },
    get: (): User | null => {
        try{
            const user = localStorage.getItem(STORAGE_KEYS.user)
            return user ? JSON.parse(user) : null
        }catch(e){
            console.error('Error getting user', e)
            return null
        }
    },
    remove: (): void => {
        try{
            localStorage.removeItem(STORAGE_KEYS.user)
        }catch(e){
            console.error('Error removing user', e)
        }
    }
}

export const clearAuthStorage = (): void => {
    accessTokenStorage.remove()
    userStorage.remove()
}

export const isAuth = (): boolean => {
    return !!accessTokenStorage.get()
}

const MAX_RECENTLY_VIEWED = 20;
const EXPIRY_DAYS = 7; 

interface RecentlyViewedItem {
    product_id: number;  
    viewedAt: number;
}

export const recentlyViewedStorage = {
    add: (productId: number): void => {
        try {
            const items = recentlyViewedStorage.get();
            
            const filtered = items.filter(item => item.product_id !== productId);
            
            const newItems: RecentlyViewedItem[] = [
                { product_id: productId, viewedAt: Date.now() },
                ...filtered
            ].slice(0, MAX_RECENTLY_VIEWED);
            
            localStorage.setItem(STORAGE_KEYS.recently_viewed, JSON.stringify(newItems));
        } catch (e) {
            console.error('Error saving recently viewed', e);
        }
    },
    
    get: (): RecentlyViewedItem[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.recently_viewed);
            if (!data) return [];
            
            const items: RecentlyViewedItem[] = JSON.parse(data);
            const now = Date.now();
            const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            
            const validItems = items.filter(item => {
                return (now - item.viewedAt) < expiryTime;
            });
            
            if (validItems.length !== items.length) {
                localStorage.setItem(STORAGE_KEYS.recently_viewed, JSON.stringify(validItems));
            }
            
            return validItems;
        } catch (e) {
            console.error('Error getting recently viewed', e);
            return [];
        }
    },
    
    getIds: (): number[] => {
        return recentlyViewedStorage.get().map(item => item.product_id);
    },
    
    remove: (productId: number): void => {
        try {
            const items = recentlyViewedStorage.get();
            const filtered = items.filter(item => item.product_id !== productId);
            localStorage.setItem(STORAGE_KEYS.recently_viewed, JSON.stringify(filtered));
        } catch (e) {
            console.error('Error removing recently viewed', e);
        }
    },
    
    clear: (): void => {
        try {
            localStorage.removeItem(STORAGE_KEYS.recently_viewed);
        } catch (e) {
            console.error('Error clearing recently viewed', e);
        }
    }
}

//cho admin
const ADMIN_STORAGE_KEYS = {
    access_token: 'admin_access_token',
    user: 'admin_user'                  
} as const;

export const adminTokenStorage = {
    save: (token: string): void => {
        try {
            localStorage.setItem(ADMIN_STORAGE_KEYS.access_token, token);
        } catch (e) {
            console.error('Error saving admin access token', e);
        }
    },
    get: (): string | null => {
        try {
            return localStorage.getItem(ADMIN_STORAGE_KEYS.access_token);
        } catch (e) {
            console.error('Error getting admin access token', e);
            return null;
        }
    },
    remove: (): void => {
        try {
            localStorage.removeItem(ADMIN_STORAGE_KEYS.access_token);
        } catch (e) {
            console.error('Error removing admin access token', e);
        }
    }
};

export const adminUserStorage = {
    save: (user: User): void => {
        try {
            localStorage.setItem(ADMIN_STORAGE_KEYS.user, JSON.stringify(user));
        } catch (e) {
            console.error('Error saving admin user', e);
        }
    },
    get: (): User | null => {
        try {
            const user = localStorage.getItem(ADMIN_STORAGE_KEYS.user);
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('Error getting admin user', e);
            return null;
        }
    },
    remove: (): void => {
        try {
            localStorage.removeItem(ADMIN_STORAGE_KEYS.user);
        } catch (e) {
            console.error('Error removing admin user', e);
        }
    }
};

export const clearAdminStorage = (): void => {
    adminTokenStorage.remove();
    adminUserStorage.remove();
};

export const isAdminAuth = (): boolean => {
    return !!adminTokenStorage.get();
};