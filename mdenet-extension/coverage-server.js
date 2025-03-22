const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
    console.log(`➡️ Incoming request: ${req.method} ${req.url}`); // DEBUG LINE

    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/coverage') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (!fs.existsSync('.nyc_output')) {
                fs.mkdirSync('.nyc_output');
            }
            fs.writeFileSync(path.join('.nyc_output', 'out.json'), body);
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*'
            });
            res.end('Coverage data saved.');
            console.log('✅ Coverage data saved!');
        });
    } else {
        res.writeHead(404, {
            'Access-Control-Allow-Origin': '*'
        });
        res.end();
        console.warn('⚠️ 404 for', req.url);
    }
}).listen(4000, () => {
    console.log('📡 Coverage server listening on http://localhost:4000');
});
