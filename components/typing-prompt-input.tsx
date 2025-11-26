"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

export default function TypingPromptInput() {
const prompts = [
  "Design a prompt that helps generate creative marketing copy for a new AI product...",
  "Write a prompt to extract action items from a lengthy project meeting transcript...",
  "Craft a prompt that converts raw customer support logs into concise summaries...",
  "Develop a prompt to simulate a job interview for a software engineering role...",
  "Create a prompt that transforms technical documentation into beginner-friendly FAQs...",
  "Generate a prompt that helps analyze sentiment across thousands of product reviews...",
  "Write a prompt that assists students in learning complex physics concepts interactively...",
  "Draft a prompt to convert spreadsheet data into a natural language report...",
  "Design a prompt that automates writing LinkedIn posts from research paper abstracts...",
  "Create a prompt that translates legal jargon into layman's terms for general audiences...",
];


  const [displayText, setDisplayText] = useState("")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)

  // Controls the typing speed
  const typingSpeed = 50 // milliseconds per character
  const deletingSpeed = 20 // milliseconds per character
  const pauseBeforeDelete = 2000 // pause before deleting
  const pauseBeforeNextPrompt = 500 // pause before typing next prompt

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isTyping) {
      // Typing animation
      if (currentCharIndex < prompts[currentPromptIndex].length) {
        timeout = setTimeout(() => {
          setDisplayText(prompts[currentPromptIndex].substring(0, currentCharIndex + 1))
          setCurrentCharIndex(currentCharIndex + 1)
        }, typingSpeed)
      } else {
        // Finished typing, pause before deleting
        timeout = setTimeout(() => {
          setIsTyping(false)
        }, pauseBeforeDelete)
      }
    } else {
      // Deleting animation
      if (currentCharIndex > 0) {
        timeout = setTimeout(() => {
          setDisplayText(prompts[currentPromptIndex].substring(0, currentCharIndex - 1))
          setCurrentCharIndex(currentCharIndex - 1)
        }, deletingSpeed)
      } else {
        // Finished deleting, move to next prompt
        timeout = setTimeout(() => {
          setCurrentPromptIndex((currentPromptIndex + 1) % prompts.length)
          setIsTyping(true)
        }, pauseBeforeNextPrompt)
      }
    }

    return () => clearTimeout(timeout)
  }, [currentCharIndex, currentPromptIndex, isTyping, prompts])

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        {/* Outer glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/30 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>

        <div className="relative">
          <Input
            className="pr-12 sm:pr-16 md:pr-20 py-3 sm:py-4 md:py-6 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl backdrop-blur-md border-2 focus-visible:ring-0 focus-visible:ring-offset-0 
            dark:bg-background/20 dark:border-white/5 dark:text-white
            bg-white/80 border-primary/10 text-gray-800 shadow-[0_4px_20px_rgba(36,101,237,0.2)]"
            placeholder=""
            value={displayText}
            readOnly
          />
          <Button
            size="icon"
            className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 
            bg-primary/90 hover:bg-primary backdrop-blur-md shadow-md"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
