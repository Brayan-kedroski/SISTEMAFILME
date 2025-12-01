const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'dabffb875f052e64b3bb23eb30fc5fd7';
const BASE_URL = 'https://api.themoviedb.org/3';

export const searchMovies = async (query, language = 'pt-BR') => {
    if (!query) return [];

    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('TMDB API Key missing. Returning mock data.');
        return [{
            id: 1,
            title: query,
            overview: 'This is a mock description because no API key was provided.',
            release_date: '2024-01-01',
            vote_average: 7.5,
            poster_path: null
        }];
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

export const getMovieTrailer = async (movieId, language = 'pt-BR') => {
    try {
        // First try with the requested language
        let response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=${language}`);
        let data = await response.json();
        let results = data.results || [];

        // Filter for Trailers on YouTube
        let trailer = results.find(video => video.site === 'YouTube' && video.type === 'Trailer');

        // If no trailer found in requested language, fallback to English
        if (!trailer && language !== 'en-US') {
            response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
            data = await response.json();
            results = data.results || [];
            trailer = results.find(video => video.site === 'YouTube' && video.type === 'Trailer');
        }

        return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
        console.error('Error fetching trailer:', error);
        return null;
    }
};

export const getMovieDetails = async (id, language = 'pt-BR') => {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=${language}`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        return null;
    }
};
