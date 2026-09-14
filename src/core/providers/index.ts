import { registerProviderFactory } from './registry'
import { createLmStudioProvider } from './lmstudio'
import { createOllamaProvider } from './ollama'
import { createLlamaCppProvider } from './llamacpp'
import { createUnslothProvider } from './unsloth'
import { createCustomProvider } from './custom'
import { createOpenRouterProvider } from './openrouter'
import { createVercelProvider } from './vercel'
import { createOpenAIProvider } from './openai'

registerProviderFactory('lmstudio', createLmStudioProvider)
registerProviderFactory('ollama', createOllamaProvider)
registerProviderFactory('llamacpp', createLlamaCppProvider)
registerProviderFactory('unsloth', createUnslothProvider)
registerProviderFactory('custom', createCustomProvider)
registerProviderFactory('openrouter', createOpenRouterProvider)
registerProviderFactory('vercel', createVercelProvider)
registerProviderFactory('openai', createOpenAIProvider)
