export interface EvaluationContext {
  // the test case input, for eval types whose criteria can be relational
  input?: string

  abortSignal?: AbortSignal
}
