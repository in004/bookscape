export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-8"></div>
        <div className="h-4 w-full max-w-md bg-gray-200 rounded mx-auto mb-3"></div>
        <div className="h-4 w-full max-w-md bg-gray-200 rounded mx-auto mb-3"></div>
        <div className="h-4 w-3/4 max-w-md bg-gray-200 rounded mx-auto"></div>
      </div>
    </div>
  )
}