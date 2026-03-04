"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const clientOptions = {
    log: ['error', 'warn'],
    adapter: new adapter_pg_1.PrismaPg(pool),
};
const prisma = global.__prisma ?? new client_1.PrismaClient(clientOptions);
if (process.env.NODE_ENV !== 'production')
    global.__prisma = prisma;
exports.default = prisma;
