import dotenv from 'dotenv'

dotenv.config()

const required = ['NODE_ENV', 'PORT']

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
}

export {}
