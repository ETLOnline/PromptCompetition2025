"use client"

/*
  Wrapper around the Sonner toaster so we can keep the same
  "@/components/ui/…" import style used by the other shadcn/ui
  components.
*/

import { Toaster as SonnerToaster } from "sonner"

/**
 * Re-export the Sonner Toaster so it can be imported as:
 *   import { Toaster } from "@/components/ui/sonner"
 */
export function Toaster() {
  // You can tweak these props (position, theme, etc.) as needed.
  return <SonnerToaster position="top-right" richColors closeButton expand />
}
