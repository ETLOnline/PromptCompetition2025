"use client"


import { fetchWithAuth } from "@/lib/api";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager"

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
      try {
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_SUPER_AUTH}`);
      } 
      catch (error) 
      {
        router.push("/");
      } 
      finally 
      {
        setLoading(false);
      }
    };

  useEffect(() => {
    checkAuth(); 
  })

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Checking authentication...</p>
      </div>
    );
  }


  return <UserRoleManager />
}
