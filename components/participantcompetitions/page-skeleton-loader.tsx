import { Spinner } from "@/components/ui/spinner"

export function PageSkeletonLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  )
}
