const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/urban-planning', async (req, res) => {
    try {
        const response = await axios.get('https://www.reinfolib.mlit.go.jp/ex-api/external/XKT001', {
            params: {
                response_format: 'geojson',
                z: 11,
                x: 1819,
                y: 806
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
