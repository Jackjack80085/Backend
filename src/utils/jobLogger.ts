export class JobLogger {
  private jobName: string
  private startTime: Date

  constructor(jobName: string) {
    this.jobName = jobName
    this.startTime = new Date()
  }

  log(message: string) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${this.jobName}] ℹ️  ${message}`)
  }

  error(message: string, error?: Error) {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] [${this.jobName}] ❌ ${message}`)
    if (error) console.error(`     Error Details:`, error.message)
  }

  complete(itemsProcessed: number) {
    const duration = new Date().getTime() - this.startTime.getTime()
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${this.jobName}] ✅ Completed in ${duration}ms - ${itemsProcessed} items processed`)
  }
}
