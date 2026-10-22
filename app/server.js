const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const client = require('prom-client');
require('dotenv').config();

const { checkDbConnection } = require('./config/db');
const { router: authRouter } = require('./routes/auth');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// PROMETHEUS METRICS SETUP
// ==========================================
const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'portfolio_app_'
});

// Custom HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestCounter);

// Custom HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

// Metrics Interceptor Middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    
    // Ignore metrics endpoint to avoid skewing stats
    if (route !== '/metrics' && route !== '/health') {
      httpRequestCounter.inc({
        method: req.method,
        route: route,
        status_code: res.statusCode
      });
      httpRequestDuration.observe(
        {
          method: req.method,
          route: route,
          status_code: res.statusCode
        },
        durationInSeconds
      );
    }
  });
  next();
});

// ==========================================
// SECURITY & LOGGING MIDDLEWARES
// ==========================================
// Configure helmet with relaxed CSP for local development and inline scripts/styles
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom JSON-like Morgan logger for Loki / Promtail log collection
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const sanitized = { ...req.body };
    if (sanitized.password) sanitized.password = '***';
    return JSON.stringify(sanitized);
  }
  return '-';
});

app.use(
  morgan((tokens, req, res) => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'portfolio-web',
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res), 10),
      responseTimeMs: parseFloat(tokens['response-time'](req, res)),
      remoteAddr: tokens['remote-addr'](req, res),
      userAgent: tokens['user-agent'](req, res)
    });
  })
);

// ==========================================
// MONITORING & HEALTH ENDPOINTS
// ==========================================
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==========================================
// APPLICATION API ROUTES
// ==========================================
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Static Web Assets
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route for SPA
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start Server
async function startServer() {
  console.log('[App] Starting Portfolio Application...');
  // Connect to database with retry
  await checkDbConnection();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[App] Server is running on http://0.0.0.0:${PORT}`);
    console.log(`[App] Health endpoint: http://0.0.0.0:${PORT}/health`);
    console.log(`[App] Prometheus metrics: http://0.0.0.0:${PORT}/metrics`);
  });
}

startServer();
