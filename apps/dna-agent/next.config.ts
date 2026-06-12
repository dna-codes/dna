import type { NextConfig } from 'next'

const config: NextConfig = {
  serverExternalPackages: ['@dna-codes/dna-mcp', '@dna-codes/dna-adapters', '@modelcontextprotocol/sdk'],
  // @dna/ui-library ships TypeScript source; Next.js compiles it directly.
  transpilePackages: ['@dna/ui-library'],
  devIndicators: false,
}

export default config
