export default function Level2DashboardPage({
  params,
}: {
  params: { competitionId: string }
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Level 2 Dashboard</h1>
        <p className="text-gray-600">Competition ID: {params.competitionId}</p>
        <p className="text-gray-600">Placeholder dashboard for Level 2 competitions.</p>
      </div>
    </div>
  )
}
