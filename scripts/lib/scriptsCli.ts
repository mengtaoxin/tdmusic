import { classifyTestFile, resolveE2ePlatforms, resolveInstallBrowsers } from './e2ePlatforms.ts'

const command = process.argv[2]
const args = process.argv.slice(3)

try {
  switch (command) {
    case 'classify-file': {
      const [root, file] = args
      if (!root || !file) throw new Error('classify-file requires root and path')
      process.stdout.write(`${classifyTestFile(root, file)}\n`)
      break
    }
    case 'resolve-platforms': {
      process.stdout.write(`${resolveE2ePlatforms(args[0] ?? '').join(',')}\n`)
      break
    }
    case 'resolve-browsers': {
      process.stdout.write(`${resolveInstallBrowsers(args[0] ?? '').join(',')}\n`)
      break
    }
    default:
      throw new Error(`unknown scriptsCli command: ${command ?? ''}`)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
}
