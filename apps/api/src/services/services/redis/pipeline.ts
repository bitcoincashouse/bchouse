import { ChainableCommander, Pipeline } from 'ioredis'

async function handlePipeline(
  pipeline: ChainableCommander,
  ...commands: Array<ChainableCommander | {} | undefined>
) {
  const result = await pipeline.exec()
  const results = Array(commands.length).fill(null)

  if (result === null) {
    return results
  }

  let pipelineIndex = 0
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i]
    if (command instanceof Pipeline) {
      results[i] = result[pipelineIndex]?.[1] || null
      pipelineIndex++
    } else {
      results[i] = command
    }
  }

  return results
}

export type PipelineCallback = (
  pipeline: ChainableCommander
) => ChainableCommander | {} | undefined
export function PipelineHandler(pipeline: ChainableCommander) {
  return async (...commandCb: Array<PipelineCallback>) => {
    const commands = commandCb.map((c) => c(pipeline))
    return await handlePipeline(pipeline, ...commands)
  }
}
