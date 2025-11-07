# Fixes Summary

## Enhancement Implementation Plan

- Goals: Add opt-in, default-off modules for logging, caching, job queue, plugin bus, and analytics. Ensure zero behavior change when flags are disabled.
- Approach: Introduce `src/utils/*` modules and gate integrations via `src/utils/config.ts` feature flags.
- Scope: Minimal, targeted changes to `src/hooks/useSupabase.ts` and `src/App.tsx` guarded behind flags.

## Changes Applied

- Config
  - Added `src/utils/config.ts` to read `VITE_FEATURE_*` env flags.

- Logging
  - Added `src/utils/log.ts` exposing `info/warn/error/event` methods.
  - Gated: Only logs when `VITE_FEATURE_LOGGING=true`.

- Cache
  - Added `src/utils/cache.ts` in-memory TTL cache.
  - Integrated into `useSupabase.loadMessages` with short TTL (15s) and invalidation on saves.
  - Gated: `VITE_FEATURE_CACHE=true` enables cache.

- Job Queue
  - Added `src/utils/jobQueue.ts`. When disabled, executes immediately to preserve behavior.

- Plugin Architecture
  - Added `src/utils/eventBus.ts` and `src/utils/plugins.ts`.
  - Emitting events (behind flag) at key points in `src/App.tsx`:
    - `message:sent`, `response:received`, `response:error`, `system:emergency_stop`.

- Analytics Stub
  - Added `src/utils/analytics.ts` with `trackEvent`, logging only when enabled.

- Documentation
  - Updated `README.md` with feature flags and testing instructions.

- Testing
  - Added Vitest (`package.json` script and dev dependency).
  - Unit tests: `tests/cache.test.ts`, `tests/log.test.ts`, `tests/eventBus.test.ts`.

## Effort & Impact Estimates

- Config & Logging: Low effort, negligible impact; default-off.
- Cache: Medium effort, low impact; read-path only, short TTL, invalidated on saves; default-off.
- Job Queue: Low effort, no impact when disabled; immediate execution preserves behavior.
- Plugins: Medium effort, low impact; events gated; registry empty by default.
- Analytics: Low effort, no impact; only logs when enabled.
- Docs & Tests: Low effort; improves maintainability.

## Verification

- Unit Tests: Passed for `cache`, `log`, and `eventBus` modules.
- Integration: Manual verification of `useSupabase` with cache disabled (default) to ensure identical behavior.
- Functional: Ran dev server; no UI changes; message flows unaffected with all flags off.

## Rollback Plan

- Flags: Set all `VITE_FEATURE_*` flags to `false` or remove them to disable enhancements instantly.
- Code Revert: If needed, revert the commits labeled "feat(flags): ..." to return to pre-enhancement state.
- Cache: If cache is enabled and issues arise, disable the flag and clear the `globalCache` via a temporary diagnostic call.

## Monitoring Plan

- Enable `VITE_FEATURE_LOGGING=true` in staging to observe structured logs around data loads and saves.
- If desired, enable `VITE_FEATURE_PLUGINS=true` and register monitoring plugins via `eventBus.on` for targeted telemetry.

## Backward Compatibility

- All enhancements are gated by feature flags and default to disabled.
- No changes to UI, stored data schemas, or core behavior when flags are off.


This document records all critical and high-severity fixes applied, with locations, root causes, diffs, and verification notes. All changes adhere to constraints: no UI changes, no feature additions, minimal, targeted fixes.

## Overview

- Fixed stale conversation history sent to AI in `App.tsx`.
- Implemented reliable cancellation behavior for AI generation in `useGemini.ts`.
- Fixed microphone resource leaks and lifecycle cleanup in `useVoice.ts`.
- Verified model selection honors `settings.aiSettings.model` — no change required.
- Tested via dev server; no runtime errors observed.

---

## 1) Stale Conversation History in Send Flow

- Location: `src/App.tsx` lines around 100–130
- Severity: High
- Root Cause: `ai.generateResponse` was called with the captured `messages` closure, which does not include the just-appended `userMessage`, leading to outdated context for the AI.

### Broken Code

```ts
setMessages(prev => [...prev, userMessage]);
await supabase.saveMessage(userMessage);
setInput('');

try {
  const aiResponse = await ai.generateResponse(messages, userMessage.text);
  // ...
}
```

### Fixed Code (Diff)

```diff
-      const aiResponse = await ai.generateResponse(messages, userMessage.text);
 +      // FIX: ensure AI receives the latest conversation including the new user message
 +      // Build a local conversation history to avoid using the stale `messages` closure
 +      const conversationHistory = [...messages, userMessage];
 +      const aiResponse = await ai.generateResponse(conversationHistory, userMessage.text);
```

### Why It Works
- Ensures the model sees the most recent user message when generating a reply.
- Avoids race conditions from stale state while preserving component behavior.

### Regression Risk
- None. UI and features unchanged; only corrects context passed to AI.

Confidence: 95%

---

## 2) Emergency Stop Did Not Cancel In-Flight AI Request

- Location: `src/hooks/useGemini.ts`
- Severity: Critical
- Root Cause: `AbortController` existed but was never wired to cancel the SDK call; `cancelGeneration` only flipped `isProcessing` without immediately rejecting ongoing work.

### Broken Code

```ts
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
// ...
const response = await Promise.race([modelPromise, timeoutPromise]);
```

### Fixed Code (Diff)

```diff
 if (abortControllerRef.current) {
-  abortControllerRef.current.abort();
 +  // Abort any in-flight request to ensure we don't have concurrent processing
 +  // This does not cancel Google's SDK request directly, but we will race against
 +  // the abort signal below to short-circuit and prevent UI state updates.
 +  abortControllerRef.current.abort();
 }
 // ...
 +      // Implement cancellation handling via AbortController
 +      // Note: GoogleGenerativeAI SDK does not accept an AbortSignal directly.
 +      // We race against an abort promise to immediately reject when cancelGeneration() is called,
 +      // preventing further state updates and speech. This avoids UI/behavior changes while fixing the bug.
 +      const cancelPromise = new Promise<never>((_, reject) => {
 +        const controller = abortControllerRef.current;
 +        if (controller) {
 +          const { signal } = controller;
 +          if (signal.aborted) {
 +            reject(new Error('Request cancelled'));
 +            return;
 +          }
 +          signal.addEventListener('abort', () => reject(new Error('Request cancelled')), { once: true });
 +        }
 +      });
 // ...
-      const response = await Promise.race([modelPromise, timeoutPromise]);
 +      // Race model execution with timeout and cancellation
 +      const response = await Promise.race([modelPromise, timeoutPromise, cancelPromise]);
```

### Why It Works
- Immediately rejects the generation flow when `cancelGeneration` is triggered.
- Prevents further state updates, speech, or UI changes from a cancelled request.

### Regression Risk
- None. External behavior remains the same; only correctness in cancellation improved.

Confidence: 90%

---

## 3) Microphone Resource Leak in Voice Hook

- Location: `src/hooks/useVoice.ts`
- Severity: High
- Root Cause: Microphone `MediaStream` and `AudioContext` were never closed when stopping listening, causing resource leaks.

### Broken Code

```ts
const monitorAudioLevel = useCallback(async () => {
  if (!audioContextRef.current) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    // ...
  }
});

const stopListening = useCallback(() => {
  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }
  setIsListening(false);
}, []);
```

### Fixed Code (Diff)

```diff
 +  const mediaStreamRef = useRef<MediaStream | null>(null); // FIX: track mic stream for proper cleanup
 // ...
 -        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 +        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 +        mediaStreamRef.current = stream; // FIX: store stream for cleanup to avoid leaks
 // ...
   useEffect(() => {
     if (isListening) {
       monitorAudioLevel();
     } else {
       setAudioLevel(0);
 +      // FIX: release audio resources when no longer listening to prevent memory leaks
 +      try {
 +        // Stop all media tracks
 +        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
 +        mediaStreamRef.current = null;
 +        // Disconnect analyser and close context
 +        analyserRef.current = null;
 +        if (audioContextRef.current) {
 +          audioContextRef.current.close();
 +          audioContextRef.current = null;
 +        }
 +      } catch (cleanupError) {
 +        console.error('Error cleaning up audio resources:', cleanupError);
 +      }
     }
   }, [isListening, monitorAudioLevel]);
 // ...
   const stopListening = useCallback(() => {
     if (recognitionRef.current) {
       recognitionRef.current.stop();
     }
     setIsListening(false);
 +    // FIX: proactively cleanup microphone resources to avoid dangling streams/contexts
 +    try {
 +      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
 +      mediaStreamRef.current = null;
 +      analyserRef.current = null;
 +      if (audioContextRef.current) {
 +        audioContextRef.current.close();
 +        audioContextRef.current = null;
 +      }
 +    } catch (cleanupError) {
 +      console.error('Error cleaning up audio resources:', cleanupError);
 +    }
   }, []);
```

### Why It Works
- Properly terminates media tracks and closes the audio context when listening stops.
- Eliminates resource leakage without affecting UI or voice features.

### Regression Risk
- None. Behavior preserved; only cleanup added.

Confidence: 95%

---

## 4) Model Selection Verification

- Location: `src/hooks/useGemini.ts`
- Severity: Low (Verification)
- Finding: `getGenerativeModel({ model: settings.model ?? 'gemini-2.5-flash' })` correctly respects selected model.
- Action: No changes applied.

Confidence: 100%

---

## Testing

- Ran dev server (`npm run dev`), opened `http://localhost:3000/` successfully.
- No console or terminal errors observed after fixes.
- Voice and chat UI rendered as before.

---

## Compliance

- No UI changes.
- No feature additions.
- Maintained existing functionality.
- Minimal, surgical code changes with inline comments for each fix.

---

## Summary of Confidence

- Stale conversation history fix: 95%
- Cancellation handling fix: 90%
- Voice resource cleanup fix: 95%
- Model selection verified (no change): 100%

---

## 5) Voice Gender Mismatch (Male Selection Producing Female Output)

- Location: `src/hooks/useVoice.ts` (`getVoice()` selection logic)
- Severity: High
- Root Cause: Name matching used `name.includes('male')` which also matches strings containing "female" (because "female" includes the substring "male"). This caused male selection to pick female voices.

### Broken Code

```ts
const voice = voicesRef.current.find(v => 
  v.name.includes(preferredName) || 
  (settings.type === 'female' && v.name.toLowerCase().includes('female')) ||
  (settings.type === 'male' && v.name.toLowerCase().includes('male'))
);

// fallback
return name.includes('male') || name.includes('man') || [...]
```

### Fixed Code (Diff)

```diff
- (settings.type === 'male' && v.name.toLowerCase().includes('male'))
+ (settings.type === 'male' && name.includes('male') && !name.includes('female'))

// fallback branch
- return name.includes('male') || name.includes('man') || [...]
+ // FIX: ensure we do not match 'female' when looking for male voices
+ return (name.includes('male') && !name.includes('female')) || name.includes('man') || [...]
```

### Why It Works
- Prevents false-positive matches for male when the voice name includes "female".
- Keeps existing voice name heuristics and preferred lists intact; no UI changes.

### Regression Risk
- None. Selection becomes more accurate without changing user-facing behavior.

Confidence: 95%