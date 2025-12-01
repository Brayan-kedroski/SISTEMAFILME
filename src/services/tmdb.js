const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'd4d51086088d924a6898950c47481b49';
const BASE_URL = 'https://api.themoviedb.org/3';

export const searchMovies = async (query, language = 'pt-BR') => {
    if (!query) return [];
    console.log(`[TMDB] Searching for "${query}" in language: ${language}`);

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
        const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${language}`;
        console.log(`[TMDB] Request URL: ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        console.log(`[TMDB] Results found: ${data.results?.length || 0}`);
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
    console.log(`[TMDB] Fetching trailer for movie ${movieId} in ${language}`);
    try {
        // First try with the requested language
        let response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=${language}`);
        let data = await response.json();
        let results = data.results || [];

        // Filter for Trailers on YouTube
        let trailer = results.find(video => video.site === 'YouTube' && video.type === 'Trailer');

        // If no trailer found in requested language, fallback to English
        if (!trailer && language !== 'en-US') {
            console.log(`[TMDB] No trailer in ${language}, trying en-US`);
            response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
            data = await response.json();
            results = data.results || [];
            trailer = results.find(video => video.site === 'YouTube' && video.type === 'Trailer');
        }

        if (trailer) {
            console.log(`[TMDB] Trailer found: ${trailer.key}`);
            return `https://www.youtube.com/embed/${trailer.key}`;
        } else {
            console.log(`[TMDB] No trailer found.`);
            return null;
        }
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
