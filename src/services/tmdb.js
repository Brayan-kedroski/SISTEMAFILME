const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYWJmZmI4NzVmMDUyZTY0YjNiYjIzZWIzMGZjNWZkNyIsIm5iZiI6MTc2NDM1NTQ0NS41NTksInN1YiI6IjY5MjllZDc1ZDgxMzVhZTMyNWE3NjJmNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9wnhmLZVPgggiLrfhH615uT9RGJPFlRE7IGX4UPDP-o';
const BASE_URL = 'https://api.themoviedb.org/3';

const getHeaders = () => ({
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
});

export const searchMovies = async (query, language = 'pt-BR') => {
    if (!query) return [];
    console.log(`[TMDB] Searching for "${query}" in language: ${language}`);

    try {
        const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=${language}`;
        console.log(`[TMDB] Request URL: ${url}`);
        const response = await fetch(url, { headers: getHeaders() });
        const data = await response.json();
        console.log(`[TMDB] Results found: ${data.results?.length || 0}`);
        return data.results || [];
    } catch (error) {
        console.error('Error fetching from TMDB:', error);
        return [];
    }
};

export const getMovieDetails = async (tmdbId, language = 'pt-BR') => {
    try {
        const response = await fetch(`${BASE_URL}/movie/${tmdbId}?language=${language}`, { headers: getHeaders() });
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
};

export const getPosterUrl = (path, size = 'w500') => {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
};

export const getMovieTrailer = async (movieId, language = 'pt-BR') => {
    console.log(`[TMDB] Fetching trailer for movie ${movieId} in ${language}`);
    try {
        // First try with the requested language
        let response = await fetch(`${BASE_URL}/movie/${movieId}/videos?language=${language}`, { headers: getHeaders() });
        let data = await response.json();
        let results = data.results || [];

        // Filter for Trailers on YouTube
        let trailer = results.find(video => video.site === 'YouTube' && video.type === 'Trailer');

        // If no trailer found in requested language, fallback to English
        if (!trailer && language !== 'en-US') {
            console.log(`[TMDB] No trailer in ${language}, trying en-US`);
            response = await fetch(`${BASE_URL}/movie/${movieId}/videos?language=en-US`, { headers: getHeaders() });
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
