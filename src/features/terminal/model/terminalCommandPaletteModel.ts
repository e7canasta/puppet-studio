import { listTerminalCommandDescriptors, type TerminalCommandDescriptor } from './terminalCommandLine'

function scoreCommandDescriptor(descriptor: TerminalCommandDescriptor, query: string): number {
  if (!query) return 10

  const normalized = query.trim().toLowerCase()
  if (!normalized) return 10

  const name = descriptor.name.toLowerCase()
  if (name === normalized) return 100
  if (name.startsWith(normalized)) return 90
  if (descriptor.aliases.some((alias) => alias.toLowerCase() === normalized)) return 88
  if (descriptor.aliases.some((alias) => alias.toLowerCase().startsWith(normalized))) return 84
  if (descriptor.usage.toLowerCase().startsWith(normalized)) return 70
  if (name.includes(normalized)) return 62
  if (descriptor.aliases.some((alias) => alias.toLowerCase().includes(normalized))) return 58
  if (descriptor.usage.toLowerCase().includes(normalized)) return 54
  if (descriptor.description.toLowerCase().includes(normalized)) return 40
  return -1
}

export function filterTerminalCommandPaletteItems(query: string): TerminalCommandDescriptor[] {
  const descriptors = listTerminalCommandDescriptors()
  const normalized = query.trim().toLowerCase()
  if (!normalized) return descriptors

  return descriptors
    .map((descriptor) => ({
      descriptor,
      score: scoreCommandDescriptor(descriptor, normalized),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score
      return left.descriptor.name.localeCompare(right.descriptor.name)
    })
    .map((entry) => entry.descriptor)
}
