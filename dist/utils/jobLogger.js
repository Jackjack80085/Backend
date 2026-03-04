"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobLogger = void 0;
class JobLogger {
    constructor(jobName) {
        this.jobName = jobName;
        this.startTime = new Date();
    }
    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.jobName}] ℹ️  ${message}`);
    }
    error(message, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [${this.jobName}] ❌ ${message}`);
        if (error)
            console.error(`     Error Details:`, error.message);
    }
    complete(itemsProcessed) {
        const duration = new Date().getTime() - this.startTime.getTime();
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.jobName}] ✅ Completed in ${duration}ms - ${itemsProcessed} items processed`);
    }
}
exports.JobLogger = JobLogger;
