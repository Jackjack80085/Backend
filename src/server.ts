// Ensure Prisma uses the binary engine at process start to avoid runtime adapter errors
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'binary'

// Force app port to 5000 (override system/env) to honor requested default
process.env.PORT = '5000'

import app from './app/app'
import config from './config'
import { startJobScheduler } from './jobs'

const port = config.PORT || 5000

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  startJobScheduler()
})
