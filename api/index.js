const express = require('express');
const path = require('path');
const fs = require('fs');

const CACHE_FILE = '/root/.cache/fallstore_ptero_session.json';
if (!globalThis.__PTERO_CACHE__) globalThis.__PTERO_CACHE__ = null;

const _origRead = fs.readFileSync;
const _origWrite = fs.writeFileSync;
const _origExists = fs.existsSync;
const _origMkdir = fs.mkdirSync;

fs.existsSync = function (p) {
    if (p === CACHE_FILE) return globalThis.__PTERO_CACHE__ !== null;
    return _origExists.apply(fs, arguments);
};
fs.readFileSync = function (p, ...rest) {
    if (p === CACHE_FILE) {
        if (globalThis.__PTERO_CACHE__ === null) {
            const e = new Error('ENOENT');
            e.code = 'ENOENT';
            throw e;
        }
        return globalThis.__PTERO_CACHE__;
    }
    return _origRead.apply(fs, [p, ...rest]);
};
fs.writeFileSync = function (p, data, ...rest) {
    if (p === CACHE_FILE) {
        globalThis.__PTERO_CACHE__ = typeof data === 'string' ? data : data.toString('utf8');
        return;
    }
    return _origWrite.apply(fs, [p, data, ...rest]);
};
fs.mkdirSync = function (p, ...rest) {
    if (p === '/root/.cache' || p === '/root') return;
    return _origMkdir.apply(fs, [p, ...rest]);
};

const ptero = require('../create-pterodactyl');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.post('/api/create', async (req, res) => {
    try {
        const { username, server, ram, forceNew } = req.body || {};
        const result = await ptero.createPterodactyl(username, server, ram, { forceNew: !!forceNew });
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: false, error: err.message });
    }
});

app.post('/api/quota', async (req, res) => {
    try {
        const result = await ptero.getQuota({ forceNew: !!req.body?.forceNew });
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: false, error: err.message });
    }
});

app.post('/api/inbox', async (req, res) => {
    try {
        const result = await ptero.getInbox({ forceNew: !!req.body?.forceNew });
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: false, error: err.message });
    }
});

app.get('/api/health', (_req, res) => res.json({ status: true, ts: Date.now() }));

app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;