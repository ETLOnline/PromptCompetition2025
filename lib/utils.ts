import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? null
    : "Please enter a valid email address";
}

export function validatePassword(password: string): string | null {
  const minLength = password.length > 10;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasCapital = /[A-Z]/.test(password);

  if (!minLength) return "Password must be longer than 10 characters.";
  if (!hasSpecialChar) return "Include at least one special character.";
  if (!hasNumber) return "Include at least one number.";
  if (!hasCapital) return "Include at least one capital letter.";

  return null;
}
