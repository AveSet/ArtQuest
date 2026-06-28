// Placeholder: builds the Rust napi module
// Requires: cargo + @napi-rs/cli
// Run: node scripts/build-rust.mjs

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const crateDir = join(process.cwd(), 'crates', 'quest-metrics')

if (!existsSync(join(crateDir, 'Cargo.toml'))) {
  console.error('Cargo.toml not found. Is Rust installed?')
  process.exit(1)
}

try {
  execSync('npx @napi-rs/cli build --release', {
    cwd: crateDir,
    stdio: 'inherit',
  })
  console.log('✓ Native module built successfully')
} catch {
  console.log('! Rust build failed. JS fallback will be used instead.')
  console.log('  Install Rust: https://rustup.rs')
  console.log('  Then: cd crates/quest-metrics && npx @napi-rs/cli build --release')
}
