const express = require('express');
const proxy = require('express-http-proxy');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const path = require('path');

const compiler = webpack(require('../webpack.config.js'));
const handler = require('./handler');
const log = require('./log');
const ProjectAPI = require('./project-api');

const routes = require('../src/routes.json').concat(require('../src/routes-dev.json'))
    .filter(route => !process.env.VIEW || process.env.VIEW === route.view);

// Create server
const app = express();
app.disable('x-powered-by');

// Server setup
app.use(log());

// Add JSON and raw body parsing for API endpoints
app.use('/api', express.json({ limit: '50mb' }));
app.use('/api', express.raw({ limit: '50mb', type: 'application/octet-stream' }));

// Serve project storage UI
app.get('/projects-storage', (req, res) => {
    res.sendFile(path.join(__dirname, 'project-storage-ui.html'));
});

// Project API routes
app.post('/api/projects', ProjectAPI.getUploadMiddleware(), ProjectAPI.saveProject);
app.get('/api/projects', ProjectAPI.listProjects);
app.get('/api/projects/:projectId', ProjectAPI.loadProject);
app.get('/api/projects/:projectId/info', ProjectAPI.getProjectInfo);
app.delete('/api/projects/:projectId', ProjectAPI.deleteProject);
app.get('/api/storage/info', ProjectAPI.getStorageInfo);

// Bind existing routes
routes.forEach(route => {
    app.get(route.pattern, handler(route));
});

const middlewareOptions = {};

app.use(webpackDevMiddleware(compiler, middlewareOptions));

const proxyHost = process.env.FALLBACK || '';
if (proxyHost !== '') {
    // Fall back to scratchr2 in development
    // This proxy middleware must come last
    app.use('/', proxy(proxyHost));
}

// Start listening
const port = process.env.PORT || 8333;
app.listen(port, () => {
    process.stdout.write(`Server listening on port ${port}\n`);
    process.stdout.write(`Local .sb3 project storage enabled at /api/projects\n`);
    process.stdout.write(`Project storage UI available at http://localhost:${port}/projects-storage\n`);
    if (proxyHost) {
        process.stdout.write(`Proxy host: ${proxyHost}\n`);
    }
});