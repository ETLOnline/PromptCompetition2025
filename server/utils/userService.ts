import { db } from "../config/firebase-admin.js"
import type { UserDocument, Role } from "../types/auth.js"

// Simple in-memory cache for user profiles
// For production, consider using Redis or a more robust caching solution
const userProfileCache = new Map<string, { data: UserDocument | null; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get user profile from Firestore with caching (Server-side with admin SDK)
 * @param uid - Clerk user ID
 * @returns UserDocument or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserDocument | null> {
  // Check cache first
  const cached = userProfileCache.get(uid)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }

  try {
    // Fetch from Firestore using admin SDK
    const userDoc = await db.collection("users").doc(uid).get()
    
    if (userDoc.exists) {
      const userData = userDoc.data() as UserDocument
      
      // Update cache
      userProfileCache.set(uid, { data: userData, timestamp: Date.now() })
      
      return userData
    } else {
      // Cache null result to avoid repeated queries for non-existent users
      userProfileCache.set(uid, { data: null, timestamp: Date.now() })
      return null
    }
  } catch (error) {
    console.error(`Error fetching user profile for ${uid}:`, error)
    return null
  }
}

/**
 * Get user role specifically (optimized for auth checks)
 * @param uid - Clerk user ID
 * @returns Role or null if not found
 */
export async function getUserRole(uid: string): Promise<Role | null> {
  const profile = await getUserProfile(uid)
  return profile?.role || null
}

/**
 * Clear user from cache (useful when profile is updated)
 * @param uid - Clerk user ID
 */
export function clearUserCache(uid: string): void {
  userProfileCache.delete(uid)
}

/**
 * Clear all cached user profiles
 */
export function clearAllUserCache(): void {
  userProfileCache.clear()
}