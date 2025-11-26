// lib/client-api.ts
// Client-side only API functions (no "use server" directive)

//----------------- welcome email API  ---------------------
export const sendWelcomeEmail = async (email: string, fullName: string, getToken?: () => Promise<string | null>) => {
  console.log(`🔄 Client: Attempting to send welcome email to ${email}`); 
  try {
    // Get the token if available (client-side call)
    let token = null;
    if (getToken) {
      token = await getToken();
    }

    const response = await fetch('/api/welcome-email', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ email, fullName }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Failed to send welcome email (${response.status})`);
    }

    console.log(`✅ Client: Welcome email request successful for ${email}`);
    return result;
  } catch (error: any) {
    console.error(`❌ Client: Failed to send welcome email to ${email}:`, error.message || error);
    throw error;
  }
};
