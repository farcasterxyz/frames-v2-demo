"use client"

import { useEffect, useState } from "react"
import sdk, { type Context } from "@farcaster/frame-sdk"
import { Button } from "~/components/ui/Button"

export default function Page() {
  const [hasHaptics, setHasHaptics] = useState(false)
  const [context, setContext] = useState<Context.FrameContext>()
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)

  useEffect(() => {
    const initApp = async () => {
      const context = await sdk.context
      setContext(context)
      await sdk.actions.ready()
      const capabilities = await sdk.getCapabilities()
      console.log(`All capabilities: ${JSON.stringify(capabilities)}`)
      const hasImpactOccurred = capabilities.includes('haptics.impactOccurred')
      const hasNotificationOccurred = capabilities.includes('haptics.notificationOccurred')
      const hasSelectionChanged = capabilities.includes('haptics.selectionChanged')
      setHasHaptics(
        hasImpactOccurred &&
        hasNotificationOccurred &&
        hasSelectionChanged
      )
      setIsSDKLoaded(true)
    }

    initApp()
  }, [])


  const impactOccurred = async (style: "light" | "medium" | "heavy" | "soft" | "rigid") => {
    await sdk.haptics.impactOccurred(style)
  }

  const notificationOccurred = async (style: 'success' | 'warning' | 'error') => {
    await sdk.haptics.notificationOccurred(style)
  }

  const selectionChanged = async () => {
    await sdk.haptics.selectionChanged()
  }

  if (!isSDKLoaded) {
    return <div>Loading...</div>
  }

  if (!hasHaptics) {
    return (
      <div
        style={{
          paddingTop: context?.client.safeAreaInsets?.top ?? 0,
          paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
          paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
          paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        }}
      >
        <div className="w-[300px] mx-auto py-2 px-2">
          <h1 className="text-2xl font-bold text-center mb-4">Haptics Demo</h1>
          <p className="text-sm mb-4">Your device does not support haptics.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4">Haptics Demo</h1>

        <div>
          <h2 className="font-2xl font-bold">Impact Feedback</h2>
          
          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.haptics.impactOccurred
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => impactOccurred('light')}>Light</Button>
              <Button onClick={() => impactOccurred('medium')}>Medium</Button>
              <Button onClick={() => impactOccurred('heavy')}>Heavy</Button>
              <Button onClick={() => impactOccurred('soft')}>Soft</Button>
              <Button onClick={() => impactOccurred('rigid')}>Rigid</Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Notification Feedback</h2>
          
          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.haptics.notificationOccurred
              </pre>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => notificationOccurred('success')} className="flex items-center justify-center gap-2">
                <span>✓</span>
                Success
              </Button>
              <Button onClick={() => notificationOccurred('warning')} className="flex items-center justify-center gap-2">
                <span>⚠</span>
                Warning
              </Button>
              <Button onClick={() => notificationOccurred('error')} className="flex items-center justify-center gap-2">
                <span>✕</span>
                Error
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Selection Feedback</h2>
          
          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.haptics.selectionChanged
              </pre>
            </div>
            <Button onClick={selectionChanged} className="w-full">
              Trigger Selection Changed
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Tap buttons to test haptic feedback</p>
        </div>
      </div>
    </div>
  )
}
