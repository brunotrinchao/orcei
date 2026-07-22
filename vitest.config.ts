import { defineVitestConfig } from '@nuxt/test-utils/config'
import { configDefaults } from 'vitest/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**/*', '**/.claude/worktrees/**/tests/e2e/**/*', '.claude/**/*']
  }
})
