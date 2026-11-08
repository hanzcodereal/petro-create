/**
 * Create Pterodactyl Account
 * Creator: IzzXd
 * Base: https://am.fallweb.my.id/create-pterodactyl.html
 * Saluran: https://whatsapp.com/channel/0029VbDyL6d9RZAh3JjEM325
 * Note: pliss guys jangan di klaim 100% buatan lu, lu boleh kok modifikasi trs share lagi tapi tolong jangan ilangin header creator sama ch-nya
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const _p = ["fJMupwGtP5IrlSHzB608x3nEdfsErTvFeMd081GnP5Ap", "w3XyVqs9w32RI6cD+GrEeJYnpgT4PsEolCOiAao8xw=="];
const _k = [0x4d, 0xa1, 0x17, 0xc3, 0x62, 0x9e, 0x0b, 0xf4];

function _ld() {
    const raw = Buffer.from(_p.join(''), 'base64');
    const out = Buffer.alloc(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw[i] ^ _k[i % _k.length];
    return out.toString('utf8');
}

function _hd() {
    try {
        const src = fs.readFileSync(__filename, 'utf8');
        const m = src.match(/^\s*\/\*\*[\s\S]*?\*\//);
        if (!m) return '';
        const keys = ['Creator:', 'Saluran:', 'Note:'];
        const lines = m[0].split('\n').map(l => l.replace(/^\s*\*?\s*/, '').replace(/\s+/g, ''));
        const pick = keys.map(k => lines.find(l => l.startsWith(k)));
        if (pick.some(x => !x)) return '';
        return crypto.createHash('sha256').update(pick.join('')).digest('hex');
    } catch (_) {
        return '';
    }
}

function _ck() {
    const h = _hd();
    if (!h || h !== _ld()) throw new Error('ctx invalid');
}

const BASE_URL = 'https://am.fallweb.my.id';
const PROXY_API = 'https://api.ikyyxd.my.id/v2l/proxy-free/ikyy-xsample';
const CACHE_FILE = path.join('/root/.cache', 'fallstore_ptero_session.json');

const CREDIT = {
    Creator: 'IzzXd',
    Saluran: 'https://whatsapp.com/channel/0029VbDyL6d9RZAh3JjEM325'
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': BASE_URL,
    'Referer': `${BASE_URL}/create-pterodactyl.html`,
    'Content-Type': 'application/json'
};

function readSessionCache() {
    try {
        if (!fs.existsSync(CACHE_FILE)) return null;
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (_) {
        return null;
    }
}

function writeSessionCache(data) {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (_) {}
}

async function fetchProxyList() {
    try {
        const res = await axios.get(PROXY_API, { timeout: 8000 });
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch (_) {}
    return [];
}

function parseProxyString(proxyStr) {
    if (!proxyStr || typeof proxyStr !== 'string') return null;
    const parts = proxyStr.trim().split(':');
    if (parts.length < 2) return null;
    const config = { protocol: 'http', host: parts[0], port: Number(parts[1]) };
    if (parts.length >= 4) config.auth = { username: parts[2], password: parts[3] };
    return config;
}

async function registerAccount() {
    _ck();
    const username = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `${username}@gmail.com`;
    const password = `Pass#${crypto.randomBytes(4).toString('hex')}!`;
    const payload = { username, email, password };

    try {
        const directRes = await axios.post(`${BASE_URL}/api/auth/register`, payload, {
            headers: HEADERS,
            timeout: 10000
        });
        if (directRes.data && directRes.data.status) {
            return { username, email, password, proxyConfig: null };
        }
    } catch (err) {
        const isRateLimit = err.response && (err.response.status === 429 || (err.response.data && err.response.data.code === 'RATE_LIMITED'));
        if (!isRateLimit) {
            const msg = (err.response && err.response.data && err.response.data.message) || err.message;
            throw new Error(`Gagal registrasi: ${msg}`);
        }
    }

    const proxies = await fetchProxyList();
    if (!proxies.length) throw new Error('IP terkena rate limit dan daftar proxy cadangan tidak tersedia');

    const shuffled = proxies.sort(() => Math.random() - 0.5);
    let lastError = null;

    for (let i = 0; i < Math.min(8, shuffled.length); i++) {
        const proxyConfig = parseProxyString(shuffled[i]);
        if (!proxyConfig) continue;
        try {
            const res = await axios.post(`${BASE_URL}/api/auth/register`, payload, {
                headers: HEADERS,
                proxy: proxyConfig,
                timeout: 8000
            });
            if (res.data && res.data.status) return { username, email, password, proxyConfig };
        } catch (e) {
            lastError = e;
        }
    }

    throw new Error(`Registrasi via proxy gagal: ${lastError ? lastError.message : 'Semua proxy timeout'}`);
}

async function loginAccount(username, password, preferredProxy = null) {
    _ck();
    const loginPayload = { identifier: username, password: password };
    const tryLogin = async (proxyConfig) => {
        const reqOpts = { headers: HEADERS, timeout: 12000 };
        if (proxyConfig) reqOpts.proxy = proxyConfig;
        return axios.post(`${BASE_URL}/api/auth/login`, loginPayload, reqOpts);
    };

    let res;
    try {
        res = await tryLogin(preferredProxy);
    } catch (err) {
        const isRateLimit = err.response && (err.response.status === 429 || (err.response.data && err.response.data.code === 'RATE_LIMITED'));
        if (isRateLimit) {
            const proxies = await fetchProxyList();
            const shuffled = proxies.sort(() => Math.random() - 0.5);
            let success = false;
            for (let i = 0; i < Math.min(6, shuffled.length); i++) {
                const pConfig = parseProxyString(shuffled[i]);
                if (!pConfig) continue;
                try {
                    res = await tryLogin(pConfig);
                    success = true;
                    break;
                } catch (_) {}
            }
            if (!success) throw new Error('Login terkena rate limit dan proxy cadangan gagal');
        } else {
            const msg = (err.response && err.response.data && err.response.data.message) || err.message;
            throw new Error(`Login gagal: ${msg}`);
        }
    }

    const data = res.data;
    if (!data || !data.status) throw new Error((data && data.message) || 'Login gagal.');

    const setCookies = res.headers['set-cookie'];
    if (!setCookies || !setCookies.length) throw new Error('Server tidak mengembalikan session cookie');

    const sessionCookie = setCookies.map(c => c.split(';')[0]).join('; ');
    return { cookie: sessionCookie, profileId: data.profileId, username };
}

async function createFreshSession() {
    _ck();
    const creds = await registerAccount();
    const session = await loginAccount(creds.username, creds.password, creds.proxyConfig);
    const sessionData = {
        cookie: session.cookie,
        username: creds.username,
        password: creds.password,
        profileId: session.profileId,
        remaining: 5,
        maximum: 5,
        updatedAt: Date.now()
    };
    writeSessionCache(sessionData);
    return sessionData;
}

async function getValidSession(forceNew = false) {
    if (!forceNew) {
        const session = readSessionCache();
        if (session && session.cookie && (session.remaining === undefined || session.remaining > 0)) {
            return session;
        }
    }
    return createFreshSession();
}

function normalizeServer(server) {
    if (!server) return 'server1';
    const s = String(server).toLowerCase().trim();
    if (s === '1' || s === 'server1' || s === 'node1') return 'server1';
    if (s === '2' || s === 'server2' || s === 'node2') return 'server2';
    if (s === '3' || s === 'server3' || s === 'node3') return 'server3';
    return s;
}

function normalizeRam(ram) {
    const r = parseInt(ram, 10);
    if (isNaN(r) || r < 1) return 1;
    if (r > 10) return 10;
    return r;
}

function normalizeUsername(username) {
    if (!username || username === 'auto' || username === 'random') {
        return `pt_${Date.now().toString(36).slice(-4)}_${Math.random().toString(36).slice(2, 6)}`;
    }
    let u = String(username).toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (u.length < 3) u = `${u}${Math.random().toString(36).slice(2, 5)}`.slice(0, 16);
    return u.slice(0, 16);
}

async function fetchInboxList(cookieHeader) {
    const res = await axios.get(`${BASE_URL}/api/pterodactyl/inbox`, {
        headers: { ...HEADERS, 'Cookie': cookieHeader },
        timeout: 15000
    });
    if (res.data && (Array.isArray(res.data) || res.data.status === true)) {
        return Array.isArray(res.data) ? res.data : (res.data.accounts || []);
    }
    return [];
}

async function checkQuotaInfo(cookieHeader) {
    const res = await axios.get(`${BASE_URL}/api/pterodactyl/quota`, {
        headers: { ...HEADERS, 'Cookie': cookieHeader },
        timeout: 10000
    });
    return res.data;
}

async function createPterodactyl(rawUsername, rawServer = 'server1', rawRam = 1, options = {}) {
    _ck();
    const t0 = Date.now();
    const username = normalizeUsername(rawUsername);
    const server = normalizeServer(rawServer);
    const ram = normalizeRam(rawRam);

    if (username.length < 3 || username.length > 16) {
        throw new Error('Username harus berupa 3-16 karakter alfanumerik atau underscore');
    }

    const validServers = ['server1', 'server2', 'server3'];
    if (!validServers.includes(server)) {
        throw new Error('Server node tidak valid. Pilihan: server1, server2, server3');
    }

    const forceNew = options.forceNew === true || options.forceRegister === true;
    let session = await getValidSession(forceNew);

    const executeCreate = async (sessionCookie) => {
        return axios.post(`${BASE_URL}/api/pterodactyl/create`, {
            username, server, ram
        }, {
            headers: { ...HEADERS, 'Cookie': sessionCookie },
            timeout: 30000
        });
    };

    let res;
    try {
        res = await executeCreate(session.cookie);
    } catch (err) {
        const isAuth = err.response && (err.response.status === 401 || err.response.status === 403);
        const errMsg = String((err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err.message);
        const isLimit = errMsg.toLowerCase().includes('limit') || errMsg.toLowerCase().includes('habis') || errMsg.toLowerCase().includes('login');

        if (isAuth || isLimit) {
            session = await createFreshSession();
            res = await executeCreate(session.cookie);
        } else {
            throw new Error(`Gagal membuat akun Pterodactyl: ${errMsg}`);
        }
    }

    const data = res.data;
    if (!data || data.status !== true) {
        const msg = String((data && (data.message || data.error)) || 'Permintaan ditolak server');
        if (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('login')) {
            session = await createFreshSession();
            const retryRes = await executeCreate(session.cookie);
            if (retryRes.data && retryRes.data.status === true) {
                data.accountId = retryRes.data.accountId;
                data.message = retryRes.data.message;
            } else {
                throw new Error((retryRes.data && (retryRes.data.message || retryRes.data.error)) || msg);
            }
        } else {
            throw new Error(msg);
        }
    }

    const accountId = data.accountId;
    let accountDetails = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await new Promise(r => setTimeout(r, attempt === 0 ? 600 : 1200));
            const list = await fetchInboxList(session.cookie);
            if (Array.isArray(list) && list.length > 0) {
                const found = list.find(a => (accountId && a.id === accountId) || a.username === username);
                if (found) {
                    accountDetails = found;
                    break;
                }
            }
        } catch (_) {}
    }

    try {
        const qInfo = await checkQuotaInfo(session.cookie);
        if (qInfo && qInfo.remaining !== undefined) {
            session.remaining = qInfo.remaining;
            session.maximum = qInfo.maximum || session.maximum;
        } else if (session.remaining !== undefined) {
            session.remaining = Math.max(0, session.remaining - 1);
        }
    } catch (_) {
        if (session.remaining !== undefined) {
            session.remaining = Math.max(0, session.remaining - 1);
        }
    }
    writeSessionCache(session);

    const result = {
        message: data.message || 'Akun panel berhasil dibuat. Detail tersedia di INBOX.',
        accountId: accountId,
        username: username,
        server: server,
        ram: `${ram} GB`,
        sessionUser: session.username,
        remainingQuota: session.remaining
    };

    if (accountDetails) {
        result.account = {
            id: accountDetails.id,
            accountId: accountDetails.accountId,
            panel: accountDetails.panel,
            domain: accountDetails.domain,
            panelUrl: accountDetails.domain ? `https://${accountDetails.domain}` : null,
            username: accountDetails.username,
            email: accountDetails.email,
            password: accountDetails.password,
            serverName: accountDetails.serverName,
            serverId: accountDetails.serverId,
            identifier: accountDetails.identifier,
            ramGB: accountDetails.ramGB,
            status: accountDetails.status,
            createdAt: accountDetails.createdAt
        };
    }

    return {
        ...CREDIT,
        time: `${Date.now() - t0}ms`,
        status: true,
        result
    };
}

async function getQuota(options = {}) {
    _ck();
    const t0 = Date.now();
    const session = await getValidSession(options.forceNew);
    const quotaData = await checkQuotaInfo(session.cookie);
    if (quotaData && quotaData.remaining !== undefined) {
        session.remaining = quotaData.remaining;
        session.maximum = quotaData.maximum || session.maximum;
        writeSessionCache(session);
    }
    return {
        ...CREDIT,
        time: `${Date.now() - t0}ms`,
        status: true,
        sessionUser: session.username,
        quota: quotaData
    };
}

async function getInbox(options = {}) {
    _ck();
    const t0 = Date.now();
    const session = await getValidSession(options.forceNew);
    const list = await fetchInboxList(session.cookie);
    return {
        ...CREDIT,
        time: `${Date.now() - t0}ms`,
        status: true,
        sessionUser: session.username,
        total: list.length,
        accounts: list
    };
}

async function extract(username, server, ram, options) {
    _ck();
    return createPterodactyl(username, server, ram, options);
}

function printUsage() {
    console.log(`Usage:
 node create-pterodactyl.js <username> <server> <ram>`);
}

async function runCliAction(fn) {
    const t0 = Date.now();
    try {
        const out = await fn();
        console.log(JSON.stringify(out, null, 2));
    } catch (err) {
        console.log(JSON.stringify({
            ...CREDIT,
            time: `${Date.now() - t0}ms`,
            status: false,
            error: err.message
        }, null, 2));
        process.exit(1);
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (!args.length || !args[0]) {
        printUsage();
        process.exit(1);
    }

    const username = args[0];
    const server = args[1] || 'server1';
    const ram = args[2] || 1;
    return runCliAction(() => createPterodactyl(username, server, ram));
}

module.exports = {
    createPterodactyl,
    create: createPterodactyl,
    extract,
    getQuota,
    getInbox
};

if (require.main === module) {
    main();
}