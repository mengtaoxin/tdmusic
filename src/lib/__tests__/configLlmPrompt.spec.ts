import { describe, it, expect } from 'vitest'

import {
  CONFIG_LLM_PROMPT_EN,
  CONFIG_LLM_PROMPT_ZH,
  configLlmPromptForLocale,
} from '../configLlmPrompt'

describe('configLlmPrompt', () => {
  it('includes schema keywords needed to generate configs.json', () => {
    for (const prompt of [CONFIG_LLM_PROMPT_EN, CONFIG_LLM_PROMPT_ZH]) {
      expect(prompt).toContain('music-list')
      expect(prompt).toContain('playlists')
      expect(prompt).toContain('id')
      expect(prompt).toContain('path')
    }
  })

  it('selects Chinese or English by locale', () => {
    expect(configLlmPromptForLocale('zh')).toBe(CONFIG_LLM_PROMPT_ZH)
    expect(configLlmPromptForLocale('zh-CN')).toBe(CONFIG_LLM_PROMPT_ZH)
    expect(configLlmPromptForLocale('en')).toBe(CONFIG_LLM_PROMPT_EN)
  })
})
