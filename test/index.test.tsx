import Spokestack, {
  PipelineProfile,
  TTSFormat,
  TraceLevel
} from '../src/index'

describe('Index', () => {
  it('has all expected exports', () => {
    expect(Spokestack.initialize).toBeDefined()
    expect(Spokestack.start).toBeDefined()
    expect(Spokestack.stop).toBeDefined()
    expect(Spokestack.activate).toBeDefined()
    expect(Spokestack.deactivate).toBeDefined()
    expect(Spokestack.synthesize).toBeDefined()
    expect(Spokestack.speak).toBeDefined()
    expect(Spokestack.classify).toBeDefined()
    expect(Spokestack.addEventListener).toBeDefined()
    expect(Spokestack.removeEventListener).toBeDefined()
    expect(Spokestack.removeAllListeners).toBeDefined()
    expect(TTSFormat).toBeDefined()
    expect(TraceLevel).toBeDefined()
    expect(PipelineProfile).toBeDefined()
  })

  // The testing of functionality is handled in the example app
  // and in spokestack-ios and spokestack-android.
})
