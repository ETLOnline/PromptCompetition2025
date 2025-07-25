// lib/firestore/countDocuments.ts
import { collection, getCountFromServer } from "firebase/firestore"
import { db } from "../../firebase"

export async function countDocuments(path: string): Promise<number> {
    try {
        const collRef = collection(db, path)
        const snapshot = await getCountFromServer(collRef)
        return snapshot.data().count
    } 
    catch (error)
    {
        console.error(`Error counting documents in "${path}"`, error)
        return 0
    }
}
