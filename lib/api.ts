const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const fetchCompetitions = async () => {
  const res = await fetch(`${API_URL}/competition`)
  if (!res.ok) throw new Error("Failed to fetch competitions")
  return res.json()
}

export const createCompetition = async (data: any, token: string) => {
  const res = await fetch(`${API_URL}/competition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  return res.json()
}

export const updateCompetition = async (id: string, data: any, token: string) => {
  const res = await fetch(`${API_URL}/competition/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  return res.json()
}

export const deleteCompetition = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/competition/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return res.json()
}
