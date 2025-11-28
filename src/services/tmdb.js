const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_API_KEY_HERE'; // Placeholder
const BASE_URL = 'https://api.themoviedb.org/3';

export const searchMovies = async (query, language = 'pt-BR') => {
    if (!query) return [];

    // If no API key is set (or is the placeholder), return mock data or empty
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('TMDB API Key missing. Returning mock data.');
        // Mock data for demonstration if no key
        return [
            {
                id: 1,
                title: query,
                overview: 'This is a mock description because no API key was provided.',
                release_date: '2024-01-01',
                vote_average: 7.5,
                poster_path: null
            }
        ];
    }

    try {
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${language}`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching from TMDB:', error);
        return [];
    }
};

export const getPosterUrl = (path, size = 'w500') => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};
