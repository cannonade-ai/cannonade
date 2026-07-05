export interface PromptVersion {
  version: number
  content: string
  createdAt: string
}

export interface Prompt {
  id: string
  name: string
  description?: string

  createdAt: string
  updatedAt: string

  versions: PromptVersion[]
}

export type PromptVersionRef = number | 'latest'

export function getLatestVersion(prompt: Prompt): PromptVersion {
  return prompt.versions[prompt.versions.length - 1]
}

export function getPromptVersion(
  prompt: Prompt,
  version: PromptVersionRef
): PromptVersion | undefined {
  if (version === 'latest') return getLatestVersion(prompt)
  return prompt.versions.find((v) => v.version === version)
}
