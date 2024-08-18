const express = require('express');
const { scrapeData } = require('./scraper');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/api/scrape', async (req, res) => {
    try {
        const data = await scrapeData();
        res.json(data);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'An error occurred while scraping data' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
