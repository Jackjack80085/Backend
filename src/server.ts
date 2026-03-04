// Remove or change this line - 'binary' is not valid in Prisma v6+
// process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'binary'

import app from './app/app'
import config from './config'
import { startJobScheduler } from './jobs'

const port = Number(process.env.PORT) || 5000

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`)
  startJobScheduler()
})