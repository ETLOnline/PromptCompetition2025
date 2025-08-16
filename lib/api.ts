import { getAuth } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL

//-------------------------------------------------------
//------------ competitions.ts API's  -------------------
//-------------------------------------------------------
export const fetchCompetitions = async () => {
  const res = await fetch(`${API_URL}/competition`)
  if (!res.ok) throw new Error("Failed to fetch competitions")
  return res.json()
}

export const createCompetition = async (data: any) => {
  return await fetchWithAuth(`${API_URL}/competition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const updateCompetition = async (id: string, data: any) => {
  return await fetchWithAuth(`${API_URL}/competition/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const deleteCompetition = async (id: string) => {
  return await fetchWithAuth(`${API_URL}/competition/${id}`, {
    method: "DELETE",
  })
};



// sends JWT token to backend And waits for approval
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) 
    throw new Error("User not authenticated");

  const token = await user.getIdToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 302) {
    window.location.href = "/"; // force full redirect
    return; // stop further execution
  }

  if (!response.ok) {
    throw new Error(await response.text());
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
