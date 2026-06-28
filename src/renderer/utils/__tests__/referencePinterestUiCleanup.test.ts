import { PINTEREST_UI_CLEANUP_SCRIPT } from '@/utils/referencePinterestUiCleanup'

describe('referencePinterestUiCleanup', () => {
  it('injection script is valid JavaScript', () => {
    expect(() => {
      // eslint-disable-next-line no-new-func
      new Function(PINTEREST_UI_CLEANUP_SCRIPT)
    }).not.toThrow()
  })
})
