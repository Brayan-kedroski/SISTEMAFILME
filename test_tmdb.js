const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYWJmZmI4NzVmMDUyZTY0YjNiYjIzZWIzMGZjNWZkNyIsIm5iZiI6MTc2NDM1NTQ0NS41NTksInN1YiI6IjY5MjllZDc1ZDgxMzVhZTMyNWE3NjJmNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9wnhmLZVPgggiLrfhH615uT9RGJPFlRE7IGX4UPDP-o';
const BASE_URL = 'https://api.themoviedb.org/3';
const query = 'Shrek';
const language = 'pt-BR';

async function testSearch() {
    const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=${language}`;
    console.log(`Testing URL: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Results found:', data.results?.length);
        if (data.results && data.results.length > 0) {
            console.log('First result:', data.results[0].title);
        } else {
            console.log('Full response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testSearch();
