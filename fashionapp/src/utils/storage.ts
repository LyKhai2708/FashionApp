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
const EXPIRY_DAYS = 1;

interface RecentlyViewedItem {
    product: Product;
    viewedAt: number;
}

export const recentlyViewedStorage = {
    add: (product: Product): void => {
        try {
            const items = recentlyViewedStorage.get();
            
            const filtered = items.filter(item => item.product.product_id !== product.product_id);
            
            const newItems: RecentlyViewedItem[] = [
                { product, viewedAt: Date.now() },
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
            
            // Filter expired items
            const validItems = items.filter(item => {
                return (now - item.viewedAt) < expiryTime;
            });
            
            // Update storage if items were filtered
            if (validItems.length !== items.length) {
                localStorage.setItem(STORAGE_KEYS.recently_viewed, JSON.stringify(validItems));
            }
            
            return validItems;
        } catch (e) {
            console.error('Error getting recently viewed', e);
            return [];
        }
    },
    
    getProducts: (): Product[] => {
        return recentlyViewedStorage.get().map(item => item.product);
    },
    
    remove: (productId: number): void => {
        try {
            const items = recentlyViewedStorage.get();
            const filtered = items.filter(item => item.product.product_id !== productId);
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
