
export function extractProductIdFromSlug(slug: string): number {
    if (!slug) return 0;
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    const id = parseInt(lastPart);
    return isNaN(id) ? 0 : id;
}
