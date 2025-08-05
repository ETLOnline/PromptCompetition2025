export function formatCompetitionDateTime(startDeadline: any, endDeadline: any) {
  const startDate = startDeadline?.toDate?.() ?? new Date(startDeadline)
  const endDate = endDeadline?.toDate?.() ?? new Date(endDeadline)

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

  const dateDisplay =
    startDate.toDateString() === endDate.toDateString()
      ? formatDate(startDate)
      : `${formatDate(startDate)} - ${formatDate(endDate)}`

  const timeDisplay = `${formatTime(startDate)} - ${formatTime(endDate)}`

  return { dateDisplay, timeDisplay }
}
