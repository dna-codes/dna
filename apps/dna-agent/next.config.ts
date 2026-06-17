import type { NextConfig } from 'next'
import { createRequire } from 'node:module'
import path from 'node:path'

// `@dna/ui-library` carries a nested React 19 in its own node_modules; this app
// pins React 18. Force a single React instance (matching the app's) so elements
// created inside the library are recognized by the app's renderer — otherwise
// React throws "Objects are not valid as a React child".
const require = createRequire(import.meta.url)
const pkgDir = (m: string) => path.dirname(require.resolve(`${m}/package.json`))
const reactAlias = {
  react: pkgDir('react'),
  'react-dom': pkgDir('react-dom'),
}

const config: NextConfig = {
  serverExternalPackages: ['@dna-codes/dna-mcp', '@dna-codes/dna-adapters', '@modelcontextprotocol/sdk'],
  // @dna/ui-library ships TypeScript source; Next.js compiles it directly.
  transpilePackages: ['@dna/ui-library'],
  devIndicators: false,
  turbopack: {
    resolveAlias: reactAlias,
  },
  webpack: (cfg) => {
    cfg.resolve = cfg.resolve ?? {}
    cfg.resolve.alias = { ...(cfg.resolve.alias ?? {}), ...reactAlias }
    return cfg
  },
}

export default config
