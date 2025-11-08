import { api } from '../utils/axios';

class SearchService {
    async getTrendingKeywords(limit: number = 6): Promise<string[]> {
        try {
            const response = await api.get(`/api/v1/search/trending?limit=${limit}`);
            return response.data?.data?.keywords || [];
        } catch (error: any) {
            console.error('Error getting trending keywords:', error);
            return [];
        }
    }

    async saveSearchKeyword(keyword: string): Promise<void> {
        try {
            await api.post('/api/v1/search', { keyword });
        } catch (error: any) {
            console.error('Error saving search keyword:', error);
        }
    }
}

export const searchService = new SearchService();
export default searchService;