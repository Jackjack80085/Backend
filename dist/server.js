"use strict";
// Remove or change this line - 'binary' is not valid in Prisma v6+
// process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'binary'
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app/app"));
const jobs_1 = require("./jobs");
const port = Number(process.env.PORT) || 5000;
app_1.default.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    (0, jobs_1.startJobScheduler)();
});
