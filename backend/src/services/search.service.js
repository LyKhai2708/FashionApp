const knex = require('../database/knex');

function searchHistoryRepository() {
    return knex('search_history');
}

async function saveSearchKeyword(keyword, userId = null) {
    if (!keyword || !keyword.trim()) {
        return null;
    }
    
    const [id] = await searchHistoryRepository().insert({
        keyword: keyword.trim(),
        user_id: userId,
        searched_at: knex.fn.now()
    });
    
    return id;
}

async function getTrendingKeywords(limit = 6) {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const results = await searchHistoryRepository()
        .select('keyword')
        .count('* as search_count')
        .where('searched_at', '>=', twentyFourHoursAgo)
        .groupBy('keyword')
        .orderBy('search_count', 'desc')
        .limit(limit);
    
    return results.map(row => row.keyword);
}

module.exports = {
    saveSearchKeyword,
    getTrendingKeywords,
};