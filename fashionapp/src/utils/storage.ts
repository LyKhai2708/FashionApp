import type { User } from '../types/auth';
const STORAGE_KEYS = {
    access_token: 'access_token',
    user: 'user'
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
