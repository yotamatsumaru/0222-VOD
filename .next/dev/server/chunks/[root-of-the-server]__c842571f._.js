module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/adminAuth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "basicAuth",
    ()=>basicAuth,
    "requireAuth",
    ()=>requireAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function basicAuth(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]('Authentication required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Admin Area"'
            }
        });
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';
    // Simple comparison for now (in production, use bcrypt comparison with DB)
    if (username === validUsername && password === validPassword) {
        return null; // Authentication successful
    }
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]('Invalid credentials', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
    });
}
function requireAuth(handler) {
    return async (request, ...args)=>{
        const authError = await basicAuth(request);
        if (authError) {
            return authError;
        }
        return handler(request, ...args);
    };
}
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getAll",
    ()=>getAll,
    "getDatabase",
    ()=>getDatabase,
    "getOne",
    ()=>getOne,
    "insert",
    ()=>insert,
    "query",
    ()=>query,
    "remove",
    ()=>remove,
    "update",
    ()=>update
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
let pool = null;
function getDatabase() {
    if (!pool) {
        pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__["Pool"]({
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });
    }
    return pool;
}
async function query(text, params) {
    const db = getDatabase();
    return db.query(text, params);
}
async function getOne(text, params) {
    const result = await query(text, params);
    return result.rows[0] || null;
}
async function getAll(text, params) {
    const result = await query(text, params);
    return result.rows;
}
async function insert(text, params) {
    const result = await query(text, params);
    return result.rows[0];
}
async function update(text, params) {
    const result = await query(text, params);
    return result.rows[0] || null;
}
async function remove(text, params) {
    const result = await query(text, params);
    return result.rowCount !== null && result.rowCount > 0;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/app/api/admin/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$adminAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/adminAuth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function handler(request) {
    try {
        // Get total revenue
        const revenueResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOne"])(`SELECT COALESCE(SUM(amount), 0) as total_revenue 
       FROM purchases 
       WHERE status = 'completed'`);
        // Get total purchases
        const purchasesResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOne"])(`SELECT COUNT(*) as total_purchases 
       FROM purchases 
       WHERE status = 'completed'`);
        // Get total events
        const eventsResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOne"])('SELECT COUNT(*) as total_events FROM events');
        // Get total artists
        const artistsResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOne"])('SELECT COUNT(*) as total_artists FROM artists');
        // Get recent purchases (last 10)
        const recentPurchases = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOne"])(`SELECT 
        p.id,
        p.customer_email,
        p.customer_name,
        p.amount,
        p.currency,
        p.purchased_at,
        e.title as event_title,
        t.name as ticket_name
       FROM purchases p
       LEFT JOIN events e ON p.event_id = e.id
       LEFT JOIN tickets t ON p.ticket_id = t.id
       WHERE p.status = 'completed'
       ORDER BY p.purchased_at DESC
       LIMIT 10`);
        // Get event sales breakdown
        const eventSales = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOne"])(`SELECT 
        e.id,
        e.title,
        COUNT(p.id) as purchase_count,
        COALESCE(SUM(p.amount), 0) as total_revenue
       FROM events e
       LEFT JOIN purchases p ON e.id = p.event_id AND p.status = 'completed'
       GROUP BY e.id, e.title
       ORDER BY total_revenue DESC
       LIMIT 10`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            totalRevenue: revenueResult?.total_revenue || 0,
            totalPurchases: purchasesResult?.total_purchases || 0,
            totalEvents: eventsResult?.total_events || 0,
            totalArtists: artistsResult?.total_artists || 0,
            recentPurchases: recentPurchases || [],
            eventSales: eventSales || []
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch statistics'
        }, {
            status: 500
        });
    }
}
const GET = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$adminAuth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAuth"])(handler);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c842571f._.js.map