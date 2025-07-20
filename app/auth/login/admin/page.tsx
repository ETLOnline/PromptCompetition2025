"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import admin from "firebase-admin";
import { LogOut } from "lucide-react"
import { signInWithEmailAndPassword, getIdTokenResult } from "firebase/auth";
import { auth } from "../../../../app/firebase"; // adjust the path to your actual Firebase client setup


// HomeIcon for the "Back to Home" link
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);


export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, user, role, logout } = useAuth(); // <- use signIn from auth-provider
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user) {
        throw new Error("Login failed: No user found.");
      }
  
      // Force refresh the ID token to get latest custom claims
      const idTokenResult = await getIdTokenResult(user, true);
      const role = idTokenResult.claims.role;
  
      console.log("User role after login:", role);
  
      if (role !== "admin") {
        setError("Access denied: You are not an admin.");
        await auth.signOut(); // optional: log them out
        return;
      }
  
      // Redirect only if admin
      router.push("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#07073a] via-[#121244] to-black p-4 font-sans">
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-[#56ffbc] transition-colors duration-300"
      >
        <HomeIcon className="h-5 w-5" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-[rgba(38,38,92,0.25)] backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300">
        <div className="p-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#56ffbc]">Admin Sign In</h1>
            <p className="text-white/70 mt-2">Admin access only. Please enter your credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">Email</label>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@test.com"
                className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300"
                disabled={loading}
              />
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="password" className="text-sm font-medium text-white/80">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full px-4 py-3 pr-12 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-white/60 hover:text-[#56ffbc] focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye Off Icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12S5.25 5.25 12 5.25 22.5 12 22.5 12 18.75 18.75 12 18.75 1.5 12 1.5 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/40 border border-red-500/60 text-red-100 px-4 py-3 rounded-lg text-center text-sm">
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-[#11998e] text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] focus:ring-offset-2 focus:ring-offset-[#07073a] disabled:bg-[#56ffbc]/50 disabled:cursor-not-allowed transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
