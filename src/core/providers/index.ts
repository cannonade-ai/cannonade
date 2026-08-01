import { registerProviderFactory } from './registry'
import { createLmStudioProvider } from './lmstudio'
import { createOllamaProvider } from './ollama'
import { createLlamaCppProvider } from './llamacpp'
import { createCustomProvider } from './custom'
import { createOpenRouterProvider } from './openrouter'
import { createVercelProvider } from './vercel'

registerProviderFactory('lmstudio', createLmStudioProvider)
registerProviderFactory('ollama', createOllamaProvider)
registerProviderFactory('llamacpp', createLlamaCppProvider)
registerProviderFactory('custom', createCustomProvider)
registerProviderFactory('openrouter', createOpenRouterProvider)
registerProviderFactory('vercel', createVercelProvider)
