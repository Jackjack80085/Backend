import cron from 'node-cron'
import { expirePaymentsJob } from './expirePayments.job'
import { cleanupInvitesJob } from './cleanupInvites.job'
import { autoReconciliationJob } from './autoReconciliation.job'
import { settlementStatusCheckJob } from './settlementStatusCheck.job'

const JOBS_ENABLED = process.env.JOBS_ENABLED === 'true'

export function startJobScheduler() {
  if (!JOBS_ENABLED) {
    console.log('⚠️  Background jobs are disabled (JOBS_ENABLED=false)')
    return
  }

  console.log('🚀 Starting background job scheduler...\n')

  // Every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('\n⏰ Running expirePayments job...')
    expirePaymentsJob()
  })

  // Daily at 3:00 AM
  cron.schedule('0 3 * * *', () => {
    console.log('\n⏰ Running cleanupInvites job...')
    cleanupInvitesJob()
  })

  // Daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('\n⏰ Running autoReconciliation job...')
    autoReconciliationJob()
  })

  // Every hour
  cron.schedule('0 * * * *', () => {
    console.log('\n⏰ Running settlementStatusCheck job...')
    settlementStatusCheckJob()
  })

  console.log('✅ Job scheduler started with 4 tasks')
  console.log('   • expirePayments: Every 5 minutes')
  console.log('   • cleanupInvites: Daily at 03:00 AM')
  console.log('   • autoReconciliation: Daily at 02:00 AM')
  console.log('   • settlementStatusCheck: Every hour\n')
}
