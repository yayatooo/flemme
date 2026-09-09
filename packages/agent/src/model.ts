import { OpenAIClient } from '@anvia/openai'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
})

const apiKey = process.env.MUX_API_KEY
const baseUrl = process.env.BASE_URL

if (!apiKey) {
  throw new Error('MUX_API_KEY is missing')
}

if (!baseUrl) {
  throw new Error('BASE_URL is missing')
}

const client = new OpenAIClient({
  apiKey,
  baseUrl,
})

export const model = client.completionModel({
  modelId: 'glm-5.3-flash',
  api: 'chat',
})
