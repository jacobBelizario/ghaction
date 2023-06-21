import axios from 'axios'
import * as core from '@actions/core'
import * as dotenv from 'dotenv'
import {
  Configuration,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  OpenAIApi
} from 'openai'

dotenv.config()

const AI_API_KEY = core.getInput('openai_api_key', {required: true}) || ''
const AI_MODEL = core.getInput('openai_model') || 'gpt-3.5-turbo'

export default async function ai(
  sfMetadata: string
): Promise<string | undefined> {
  try {
    if (!AI_API_KEY) {
      throw new Error('Oops - You must set your OpenAI API Key as an env var!')
    }
    if (AI_API_KEY === 'test') {
      return 'test'
    } else {
      const configuration = new Configuration({
        apiKey: AI_API_KEY
      })
      const openai = new OpenAIApi(configuration)
      const initialSystemMessage: ChatCompletionRequestMessage = {
        role: 'system',
        content:
          `Pretend you're a rigorous code reviewer who can analyze and comment on any code to prevent security violations, improve code quality, and enforce coding best practices.\n*CODE SUMMARY:*\nDescribe what type of code this is including the language and purpose.\n*CODE REVIEW:*\n*1. Observation: blah blah blah*\n        - Reasoning:\n        - Code Example: \n        - Code Recommendation: ,`
      }
      const userMessage: ChatCompletionRequestMessage = {
        role: 'user',
        content: sfMetadata
      }
      const payload: CreateChatCompletionRequest = {
        model: AI_MODEL,
        messages: [initialSystemMessage, userMessage]
      }
      const completion = await openai.createChatCompletion(payload)
      return completion?.data?.choices[0]?.message?.content || ''
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        `${err.response?.status} - ${err.response?.data?.error?.message}`
      )
    } else if (err instanceof Error) {
      throw new Error(err.message)
    }
  }
}
