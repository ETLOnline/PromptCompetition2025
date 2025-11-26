"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from "lucide-react"
import { submitContactForm } from "@/lib/api";



export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    role: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitContactForm(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  if (isSubmitted) {
    return (
      <Card className="bg-white text-black">
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[400px] text-center">
          <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-black mb-4" />
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Thank You!</h3>
          <p className="text-xs sm:text-sm mb-6">
            Your inquiry has been received. Our enterprise team will contact you shortly to discuss your specific
            requirements.
          </p>
          <Button
            className="text-black bg-gray-200 gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 h-10 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                firstName: "",
                lastName: "",
                email: "",
                company: "",
                role: "",
                message: "",
              });
            }}
          >
            Submit Another Inquiry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white text-black">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg md:text-xl text-black">Contact Our Enterprise Team</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-black">
          Fill out the form below to discuss your organization's needs and receive a custom quote.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs sm:text-sm text-black">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="text-black"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs sm:text-sm text-black">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="text-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm text-black">Work Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="text-black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-xs sm:text-sm text-black">Company/Educational Organization</Label>
            <Input
              id="company"
              name="company"
              placeholder="Acme Inc."
              value={formData.company}
              onChange={handleChange}
              required
              className="text-black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs sm:text-sm text-black">Your Role</Label>
            <Input
              id="role"
              name="role"
              placeholder="CTO, IT Director, etc."
              value={formData.role}
              onChange={handleChange}
              required
              className="text-black"
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="size" className="text-black">Organization Size</Label>
            <Select value={formData.size} onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, size: value }))
            }>
              <SelectTrigger id="size" className="text-black">
                <SelectValue placeholder="Select organization size" />
              </SelectTrigger>
              <SelectContent className="text-black bg-white">
                <SelectItem value="1-50">1-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1000 employees</SelectItem>
                <SelectItem value="1001+">1001+ employees</SelectItem>
                <SelectItem value="government">Government Agency</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="message" className="text-xs sm:text-sm text-black">How can we help?</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your specific requirements and use cases..."
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              className="text-black"
            />
          </div>
          <Button
            type="submit"
            className="w-full justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 h-10 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Request Information"}
          </Button>

          <p className="text-[10px] sm:text-xs text-black text-center">
            By submitting this form, you agree to our privacy policy and terms of service.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
