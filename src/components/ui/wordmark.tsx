import * as React from "react"

import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      data-slot="wordmark"
      className={cn("flex items-center gap-2", className)}
    >
      <div
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white"
      >
        E
      </div>
      <span className="text-base font-semibold tracking-tight text-foreground">
        Elite Tools
      </span>
    </span>
  )
}
