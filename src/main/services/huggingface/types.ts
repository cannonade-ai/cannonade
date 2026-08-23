export interface HuggingFaceSibling {
  rfilename: string
  size?: number
  lfs?: { size?: number }
}

export interface HuggingFaceGgufInfo {
  architecture?: string
  context_length?: number
  total?: number
  totalFileSize?: number
}

export interface HuggingFaceModelResponse {
  id: string
  author?: string
  pipeline_tag?: string
  tags?: string[]
  downloads?: number
  likes?: number
  lastModified?: string
  gated?: boolean | string
  siblings?: HuggingFaceSibling[]
  gguf?: HuggingFaceGgufInfo
}
