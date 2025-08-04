import { create } from "zustand"

interface SubmissionStore {
  submissions: number | null
  challengeCount: number | null
  setValues: (submissions: number, challengeCount: number) => void
}

export const useSubmissionStore = create<SubmissionStore>((set) => ({
  submissions: null,
  challengeCount: null,
  setValues: (submissions, challengeCount) => set({ submissions, challengeCount }),
}))