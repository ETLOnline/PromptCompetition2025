// lib/firestore/countDocuments.ts
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function countDocuments(path: string): Promise<number> {
    try {
        const collRef = collection(db, path)
        const snapshot = await getDocs(collRef)
        return snapshot.size
    } 
    catch (error)
    {
        console.error(`Error counting documents in "${path}"`, error)
        return 0
    }
}
 