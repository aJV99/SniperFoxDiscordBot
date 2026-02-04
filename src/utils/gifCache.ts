/**
 * GIF cache utility to reduce API calls and avoid repeats
 * Caches search results and tracks recently shown GIFs
 */

interface CachedGifs {
    gifs: any[];
    timestamp: number;
}

interface GifCache {
    [query: string]: CachedGifs;
}

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

// Track recently shown GIFs to avoid immediate repeats
const MAX_RECENT_GIFS = 15;

const cache: GifCache = {};
const recentGifs: Map<string, string[]> = new Map();

/**
 * Gets a random GIF from cache or fetches new ones if cache is stale
 */
export async function getRandomGif(
    query: string,
    apiKey: string,
    apiEndpoint: string
): Promise<string> {
    const now = Date.now();

    // Check if cache exists and is still valid
    const cached = cache[query];
    const isCacheValid = cached && now - cached.timestamp < CACHE_DURATION_MS;

    // Fetch new results if cache is stale or doesn't exist
    if (!isCacheValid) {
        console.log(`[GIF CACHE] Fetching new GIFs for "${query}"...`);

        const response = await fetch(
            `${apiEndpoint}?api_key=${apiKey}&q=${query}&limit=50&rating=r`
        );

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data: any = await response.json();

        if (!data.data || data.data.length === 0) {
            throw new Error('No GIFs found');
        }

        // Update cache
        cache[query] = {
            gifs: data.data,
            timestamp: now,
        };

        console.log(`[GIF CACHE] Cached ${data.data.length} GIFs for "${query}"`);
    }

    // Get available GIFs (excluding recently shown ones)
    const recentList = recentGifs.get(query) || [];
    const availableGifs = cache[query].gifs.filter(gif => !recentList.includes(gif.id));

    // If all GIFs have been shown recently, reset the recent list
    if (availableGifs.length === 0) {
        console.log(`[GIF CACHE] All GIFs shown recently, resetting for "${query}"`);
        recentGifs.set(query, []);
        return getRandomGif(query, apiKey, apiEndpoint); // Recursive call with reset list
    }

    // Pick a random GIF from available ones
    const randomIndex = Math.floor(Math.random() * availableGifs.length);
    const selectedGif = availableGifs[randomIndex];

    // Track this GIF as recently shown
    const updatedRecent = [selectedGif.id, ...recentList].slice(0, MAX_RECENT_GIFS);
    recentGifs.set(query, updatedRecent);

    console.log(
        `[GIF CACHE] Selected GIF ${randomIndex + 1}/${availableGifs.length} available (${recentList.length} recent)`
    );

    return selectedGif.url;
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats(): string {
    const stats = Object.entries(cache).map(([query, data]) => {
        const age = Math.floor((Date.now() - data.timestamp) / 1000 / 60);
        const recent = recentGifs.get(query)?.length || 0;
        return `"${query}": ${data.gifs.length} cached (${age}m old), ${recent} recent`;
    });

    return stats.join('\n') || 'Cache is empty';
}
