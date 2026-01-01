//lib/api.ts
"use server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * The fetchWithAuth function requires getToken from useAuth() hook on client side
 * 
 * Example usage in a client component:
 * 
 * import { useAuth } from "@clerk/nextjs"
 * 
 * const MyComponent = () => {
 *   const { getToken } = useAuth()
 *   
 *   const handleSubmit = async () => {
 *     const data = await createCompetition(competitionData, getToken);
 *     const results = await fetchCompetitionResults(competitionId, getToken);
 *   }
 * }
 * 
 * On server side, fetchWithAuth automatically gets the token from Clerk server auth
 */

//-------------------------------------------------------
//------------ competitions.ts API's  -------------------
//-------------------------------------------------------
export const fetchCompetitions = async () => {
  const res = await fetch(`${API_URL}/competition`)
  if (!res.ok) throw new Error("Failed to fetch competitions")
  return res.json()
}

export const createCompetition = async (data: any, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/competition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }, getToken);
};

export const updateCompetition = async (id: string, data: any, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/competition/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }, getToken);
};

export const deleteCompetition = async (id: string, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/competition/${id}`, {
    method: "DELETE",
  }, getToken)
};

export const generateLeaderboard = async (competitionId: string, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/leaderboard/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ competitionId }),
  }, getToken);
};

export const generateLevel1FinalLeaderboard = async (competitionId: string, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/last/${competitionId}/level1-final-leaderboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }, getToken);
};

export const generateCustomFinalLeaderboard = async (competitionId: string, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/last/${competitionId}/final-leaderboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }, getToken);
};


// sends Clerk session token to backend And waits for approval
// Pass getToken function from useAuth() hook on client side
// On server side, it will automatically get token from Clerk server auth
export async function fetchWithAuth(
  url: string, 
  options: RequestInit = {},
  getToken?: () => Promise<string | null>
) {
  let token: string | null = null;

  if (typeof window !== 'undefined') {
    // Client-side: Use the getToken function passed from the component
    if (!getToken) {
      throw new Error("getToken function is required on client side. Use the useAuth hook to get it.");
    }
    
    try {
      token = await getToken();
      
      if (!token) {
        throw new Error("No authentication token available");
      }
    } catch (error) {
      console.error("Client-side auth error:", error);
      throw new Error("User not authenticated");
    }
  } else {
    // Server-side: get token from Clerk server auth (Next.js 15+)
    try {
      const authObj = await auth();
      token = await authObj.getToken();
    } catch (error) {
      console.error("Server-side auth error:", error);
      throw new Error("User not authenticated");
    }
  }

  if (!token) {
    throw new Error("User not authenticated");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 302) {
    if (typeof window !== 'undefined') {
      window.location.href = "/"; // force full redirect
    }
    return; // stop further execution
  }

  if (!response.ok) {
    // Try to parse JSON error response
    const contentType = response.headers.get('content-type');
    let errorMessage = 'An error occurred';
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      } else {
        errorMessage = await response.text();
      }
    } catch (parseError) {
      errorMessage = `Request failed with status ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}


//----------------- contact us API  ---------------------
export const submitContactForm = async (formData: any) => {
  const res = await fetch(`${API_URL}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

// ---------------- competition results ----------------
export const fetchCompetitionResults = async (competitionId: string, getToken?: () => Promise<string | null>) => {
  if (!competitionId) {
    throw new Error("Competition ID is required");
  }

  return await fetchWithAuth(`${API_URL}/results/${competitionId}`, {
    method: "GET",
  }, getToken);
};

//-------------------------------------------------------
//------------ submissions API's  ----------------------
//-------------------------------------------------------

export const checkExistingSubmission = async (
  competitionId: string,
  challengeId: string,
  getToken?: () => Promise<string | null>
) => {
  return await fetchWithAuth(`${API_URL}/submissions/check/${competitionId}/${challengeId}`, {
    method: "GET",
  }, getToken);
};

export const submitPrompt = async (
  competitionId: string,
  challengeId: string,
  promptText: string,
  getToken?: () => Promise<string | null>
) => {
  return await fetchWithAuth(`${API_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      competitionId,
      challengeId,
      promptText,
    }),
  }, getToken);
};

export const fetchSubmission = async (
  competitionId: string,
  challengeId: string,
  getToken?: () => Promise<string | null>
) => {
  return await fetchWithAuth(`${API_URL}/submissions/${competitionId}/${challengeId}`, {
    method: "GET",
  }, getToken);
};

export const fetchCompetitionSubmissions = async (competitionId: string, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/submissions/competition/${competitionId}`, {
    method: "GET",
  }, getToken);
};

// Admin endpoint to fetch all submissions for a competition
export const fetchAdminCompetitionSubmissions = async (competitionId: string, getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/submissions/admin/competition/${competitionId}`, {
    method: "GET",
  }, getToken);
};

//-------------------------------------------------------
//------------ daily challenge API's  ------------------
//-------------------------------------------------------

export const fetchDailyChallenges = async () => {
  const res = await fetch(`${API_URL}/dailychallenge`)
  if (!res.ok) throw new Error("Failed to fetch daily challenges")
  return res.json()
}

export const fetchDailyChallengeById = async (id: string) => {
  const res = await fetch(`${API_URL}/dailychallenge/${id}`)
  if (!res.ok) throw new Error("Failed to fetch daily challenge")
  return res.json()
}

//-------------------------------------------------------
//------------ overall leaderboard API's  --------------
//-------------------------------------------------------

export const generateOverallLeaderboard = async (getToken?: () => Promise<string | null>) => {
  return await fetchWithAuth(`${API_URL}/leaderboard-overall/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }, getToken);
};

export const fetchOverallLeaderboard = async (limit: number = 100) => {
  const res = await fetch(`${API_URL}/leaderboard-overall?limit=${limit}`)
  if (!res.ok) throw new Error("Failed to fetch overall leaderboard")
  return res.json()
}

//-------------------------------------------------------
//------------ user profile API's  ---------------------
//-------------------------------------------------------

export const fetchUsersByIds = async (userIds: string[], getToken?: () => Promise<string | null>) => {
  if (!userIds || userIds.length === 0) {
    return {}
  }

  // Expected backend endpoint: POST /api/users/batch
  // Body: { "userIds": ["id1", "id2", ...] }
  // Response: { "id1": { id, fullName, email, photoURL? }, "id2": {...} }
  return await fetchWithAuth(`${API_URL}/users/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds }),
  }, getToken);
};

//-------------------------------------------------------
//------------ LLM evaluations API's  ------------------
//-------------------------------------------------------

// Fetch submissions for a specific participant in a challenge
export const fetchParticipantSubmissions = async (
  competitionId: string,
  challengeId: string,
  participantId: string,
  getToken?: () => Promise<string | null>
) => {
  return await fetchWithAuth(
    `${API_URL}/llm-evaluations/${competitionId}/challenges/${challengeId}/submissions/participant/${participantId}`,
    {
      method: "GET",
    },
    getToken
  );
};

// Fetch ALL submissions for a specific participant across all challenges
export const fetchAllParticipantSubmissions = async (
  competitionId: string,
  participantId: string,
  getToken?: () => Promise<string | null>
) => {
  return await fetchWithAuth(
    `${API_URL}/llm-evaluations/${competitionId}/participant/${participantId}/all-submissions`,
    {
      method: "GET",
    },
    getToken
  );
};
