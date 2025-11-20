"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { User, Building, MapPin, Map, GraduationCap, Briefcase, Linkedin, FileText, X } from "lucide-react"
import CustomDropdown from "@/components/CustomDropdown"

export default function ProfileSetupPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // State for form fields
  const [fullName, setFullName] = useState("")
  const [institution, setInstitution] = useState("")
  const [gender, setGender] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [majors, setMajors] = useState("")
  const [category, setCategory] = useState("Uni Students")
  const [linkedin, setLinkedin] = useState("")
  const [bio, setBio] = useState("")
  const [consent, setConsent] = useState(false)

  // Error states
  const [nameError, setNameError] = useState<string | null>(null)
  const [institutionError, setInstitutionError] = useState<string | null>(null)
  const [genderError, setGenderError] = useState<string | null>(null)
  const [cityError, setCityError] = useState<string | null>(null)
  const [provinceError, setProvinceError] = useState<string | null>(null)
  const [majorsError, setMajorsError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [linkedinError, setLinkedinError] = useState<string | null>(null)
  const [bioError, setBioError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState<string | null>(null)

  // Global form state
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Pre-populate form with user data and check if already completed
  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has already completed profile setup
      const publicMetadata = user.publicMetadata as { role?: string } | undefined
      if (publicMetadata?.role) {
        // User has already completed profile, redirect to participant dashboard
        router.push('/participant')
        return
      }

      setFullName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim())
    }
  }, [isLoaded, user, router])

  // Validation Functions
  const validateFullName = (name: string): string | null => {
    const trimmedName = name.trim()

    if (!trimmedName || trimmedName.length === 0) {
      return "Full name is required."
    }

    if (trimmedName.length < 3) {
      return "Full name must be at least 3 characters long."
    }

    if (trimmedName.length > 50) {
      return "Full name must not exceed 50 characters."
    }

    const validNameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/
    if (!validNameRegex.test(trimmedName)) {
      return "Full name must contain only English letters and single spaces between words."
    }

    if (/\d/.test(trimmedName)) {
      return "Full name cannot contain numbers."
    }

    if (/[!@#$%^&*(),.?":{}|<>[\]\\/_+=`~;'-]/.test(trimmedName)) {
      return "Full name cannot contain special characters."
    }

    if (/[^\x00-\x7F]/.test(trimmedName)) {
      return "Full name must contain only English letters."
    }

    const htmlTagRegex = /<[^>]*>/g
    if (htmlTagRegex.test(trimmedName)) {
      return "Invalid input detected."
    }

    if (/\s{2,}/.test(trimmedName)) {
      return "Full name cannot contain multiple consecutive spaces."
    }

    return null
  }

  const validateInstitution = (inst: string): string | null => {
    const trimmedInst = inst.trim()

    if (!trimmedInst || trimmedInst.length === 0) {
      return "Institution/Organization is required."
    }

    if (trimmedInst.length < 3) {
      return "Institution name must be at least 3 characters long."
    }

    if (trimmedInst.length > 100) {
      return "Institution name must not exceed 100 characters."
    }

    const validInstRegex = /^[A-Za-z\s.\-&']+$/
    if (!validInstRegex.test(trimmedInst)) {
      return "Institution name can only contain letters, spaces, dots, hyphens, ampersands, and apostrophes."
    }

    if (/[^\x00-\x7F]/.test(trimmedInst)) {
      return "Institution name must contain only English characters."
    }

    const htmlTagRegex = /<[^>]*>/g
    if (htmlTagRegex.test(trimmedInst)) {
      return "Invalid input detected."
    }

    if (/\s{2,}/.test(trimmedInst)) {
      return "Institution name cannot contain multiple consecutive spaces."
    }

    if (/[!@#$%^*()_+={}[\]|\\:;"<>?,/~`]/.test(trimmedInst)) {
      return "Institution name contains invalid special characters."
    }

    return null
  }

  const validateGender = (g: string): string | null => {
    const allowed = ["male", "female", "prefer_not_to_say"]
    if (!g) return "Gender is required."
    if (!allowed.includes(g)) return "Invalid gender selection."
    return null
  }

  const validateCity = (c: string): string | null => {
    const trimmed = c.trim()
    if (!trimmed) return "City is required."
    if (trimmed.length < 2) return "City must be at least 2 characters long."
    if (trimmed.length > 50) return "City must not exceed 50 characters."
    const validCityRegex = /^[A-Za-z\s.\-']+$/
    if (!validCityRegex.test(trimmed)) return "City can only contain letters, spaces, dots, hyphens, and apostrophes."
    if (/[^\x00-\x7F]/.test(trimmed)) return "City must contain only English characters."
    if (/<[^>]*>/g.test(trimmed)) return "Invalid input detected."
    if (/\s{2,}/.test(trimmed)) return "City cannot contain multiple consecutive spaces."
    return null
  }

  const validateProvince = (p: string): string | null => {
    const trimmed = p.trim()
    if (!trimmed) return "Province is required."
    if (trimmed.length < 2) return "Province must be at least 2 characters long."
    if (trimmed.length > 50) return "Province must not exceed 50 characters."
    const validProvinceRegex = /^[A-Za-z\s.\-']+$/
    if (!validProvinceRegex.test(trimmed)) return "Province can only contain letters, spaces, dots, hyphens, and apostrophes."
    if (/[^\x00-\x7F]/.test(trimmed)) return "Province must contain only English characters."
    if (/<[^>]*>/g.test(trimmed)) return "Invalid input detected."
    if (/\s{2,}/.test(trimmed)) return "Province cannot contain multiple consecutive spaces."
    return null
  }

  const validateMajors = (m: string): string | null => {
    const trimmed = m.trim()
    if (!trimmed) return "Major/Field is required."
    if (trimmed.length < 2) return "Major must be at least 2 characters long."
    if (trimmed.length > 100) return "Major must not exceed 100 characters."
    const validMajorsRegex = /^[A-Za-z0-9\s.,/&'-]+$/
    if (!validMajorsRegex.test(trimmed)) return "Major can include letters, numbers, spaces, and . , / & - ' characters."
    if (/[^\x00-\x7F]/.test(trimmed)) return "Major must contain only English characters."
    if (/<[^>]*>/g.test(trimmed)) return "Invalid input detected."
    if (/\s{2,}/.test(trimmed)) return "Major cannot contain multiple consecutive spaces."
    return null
  }

  const validateCategory = (cat: string): string | null => {
    if (!cat) return "Category is required."
    if (cat === "Professional") return "This event is only for uni students."
    if (cat !== "Uni Students") return "Invalid category selection."
    return null
  }

  const validateLinkedIn = (url: string): string | null => {
    const trimmed = url.trim()
    if (!trimmed) return null
    if (trimmed.length > 200) return "LinkedIn URL must not exceed 200 characters."
    const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/
    if (!linkedInRegex.test(trimmed)) return "Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)."
    if (/<[^>]*>/g.test(trimmed)) return "Invalid input detected."
    return null
  }

  const validateBio = (b: string): string | null => {
    const trimmed = b.trim()
    if (!trimmed) return null
    if (trimmed.length > 500) return "Bio must not exceed 500 characters."
    if (/<[^>]*>/g.test(trimmed)) return "Invalid input detected."
    return null
  }

  const validateConsent = (c: boolean): string | null => {
    if (!c) return "You must confirm you are a university student to register."
    return null
  }

  // Event Handlers
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const allowedCharsRegex = /^[A-Za-z\s]*$/
    
    if (!allowedCharsRegex.test(value)) {
      return
    }

    setFullName(value)
    setNameError(validateFullName(value))
  }

  const handleInstitutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    const allowedCharsRegex = /^[A-Za-z\s.\-&']*$/
    
    if (!allowedCharsRegex.test(value)) {
      return
    }

    setInstitution(value)
    setInstitutionError(validateInstitution(value))
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setGender(value)
    setGenderError(validateGender(value))
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const allowed = /^[A-Za-z\s.\-']*$/
    if (!allowed.test(value)) return
    setCity(value)
    setCityError(validateCity(value))
  }

  const handleProvinceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const allowed = /^[A-Za-z\s.\-']*$/
    if (!allowed.test(value)) return
    setProvince(value)
    setProvinceError(validateProvince(value))
  }

  const handleMajorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const allowed = /^[A-Za-z0-9\s.,/&'-]*$/
    if (!allowed.test(value)) return
    setMajors(value)
    setMajorsError(validateMajors(value))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setCategory(value)
    setCategoryError(validateCategory(value))
  }

  const handleLinkedinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLinkedin(value)
    setLinkedinError(validateLinkedIn(value))
  }

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setBio(value)
    setBioError(validateBio(value))
  }

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setConsent(checked)
    setConsentError(validateConsent(checked))
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    // Validate all fields
    const trimmedName = fullName.trim()
    const nameValidationError = validateFullName(trimmedName)
    if (nameValidationError) {
      setNameError(nameValidationError)
      setFormError(nameValidationError)
      setLoading(false)
      return
    }

    const trimmedInst = institution.trim()
    const instValidationError = validateInstitution(trimmedInst)
    if (instValidationError) {
      setInstitutionError(instValidationError)
      setFormError(instValidationError)
      setLoading(false)
      return
    }

    const genderValidationError = validateGender(gender)
    if (genderValidationError) {
      setGenderError(genderValidationError)
      setFormError(genderValidationError)
      setLoading(false)
      return
    }

    const cityValidationError = validateCity(city)
    if (cityValidationError) {
      setCityError(cityValidationError)
      setFormError(cityValidationError)
      setLoading(false)
      return
    }

    const provinceValidationError = validateProvince(province)
    if (provinceValidationError) {
      setProvinceError(provinceValidationError)
      setFormError(provinceValidationError)
      setLoading(false)
      return
    }

    const majorsValidationError = validateMajors(majors)
    if (majorsValidationError) {
      setMajorsError(majorsValidationError)
      setFormError(majorsValidationError)
      setLoading(false)
      return
    }

    const categoryValidationError = validateCategory(category)
    if (categoryValidationError) {
      setCategoryError(categoryValidationError)
      setFormError(categoryValidationError)
      setLoading(false)
      return
    }

    const linkedInValidationError = validateLinkedIn(linkedin)
    if (linkedInValidationError) {
      setLinkedinError(linkedInValidationError)
      setFormError(linkedInValidationError)
      setLoading(false)
      return
    }

    const bioValidationError = validateBio(bio)
    if (bioValidationError) {
      setBioError(bioValidationError)
      setFormError(bioValidationError)
      setLoading(false)
      return
    }

    const consentValidationError = validateConsent(consent)
    if (consentValidationError) {
      setConsentError(consentValidationError)
      setFormError(consentValidationError)
      setLoading(false)
      return
    }

    // Update Clerk user via API
    try {
      const response = await fetch('/api/profile-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: trimmedName.split(' ')[0],
          lastName: trimmedName.split(' ').slice(1).join(' '),
          institution: institution.trim(),
          gender: gender,
          city: city.trim(),
          province: province.trim(),
          majors: majors.trim(),
          category: category,
          linkedin: linkedin.trim() || '',
          bio: bio.trim() || '',
          consent: consent
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response received:", text.substring(0, 200))
        throw new Error("Server returned an invalid response. Please check the console for details.")
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      // Profile updated successfully! Sign out the user so they can sign back in with updated profile
      // console.log("Profile updated successfully! Signing out and redirecting to login...")
      
      // Sign out and redirect to login page
      await signOut({ redirectUrl: '/auth/login?message=profile-complete' })
    } catch (err: any) {
      console.error("Error updating user profile:", err)
      setFormError(err.message || "An error occurred. Please try again.")
      setLoading(false)
    }
  }

  // Check if all required fields are valid
  const isFormValid =
    fullName.trim().length > 0 &&
    institution.trim().length > 0 &&
    gender.trim().length > 0 &&
    city.trim().length > 0 &&
    province.trim().length > 0 &&
    majors.trim().length > 0 &&
    category.trim().length > 0 &&
    consent &&
    !validateFullName(fullName) &&
    !validateInstitution(institution) &&
    !validateGender(gender) &&
    !validateCity(city) &&
    !validateProvince(province) &&
    !validateMajors(majors) &&
    !validateCategory(category) &&
    !validateLinkedIn(linkedin) &&
    !validateBio(bio) &&
    !validateConsent(consent) &&
    !nameError &&
    !institutionError &&
    !genderError &&
    !cityError &&
    !provinceError &&
    !majorsError &&
    !categoryError &&
    !linkedinError &&
    !bioError &&
    !consentError

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center mb-8 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
              <p className="text-gray-600">Just a few more details to get you started.</p>
            </div>

            {/* Form Error Message */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <X className="h-5 w-5" />
                <span className="text-sm">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={handleFullNameChange}
                    required
                    placeholder="Enter your name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                      nameError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                {nameError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <label htmlFor="institution" className="text-sm font-medium text-slate-700">
                  Institution / Organization
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    value={institution}
                    onChange={handleInstitutionChange}
                    required
                    placeholder="FAST University"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                      institutionError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
                {institutionError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {institutionError}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  3-100 characters, letters, spaces, dots, hyphens, ampersands, and apostrophes only
                </p>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium text-slate-700">Gender</label>
                <CustomDropdown
                  id="gender"
                  value={gender}
                  onChange={handleGenderChange}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
                  ]}
                  placeholder="Select gender"
                  icon={User}
                  error={genderError}
                  disabled={loading}
                  required
                />
                {genderError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {genderError}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-slate-700">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={handleCityChange}
                    required
                    placeholder="Lahore"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 ${cityError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                {cityError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />{cityError}</p>
                )}
              </div>

              {/* Province */}
              <div className="space-y-2">
                <label htmlFor="province" className="text-sm font-medium text-slate-700">Province / State</label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="province"
                    type="text"
                    value={province}
                    onChange={handleProvinceChange}
                    required
                    placeholder="Punjab"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 ${provinceError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    disabled={loading}
                    maxLength={50}
                  />
                </div>
                {provinceError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />{provinceError}</p>
                )}
              </div>

              {/* Majors */}
              <div className="space-y-2">
                <label htmlFor="majors" className="text-sm font-medium text-slate-700">Major / Field of Study</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="majors"
                    type="text"
                    value={majors}
                    onChange={handleMajorsChange}
                    required
                    placeholder="IT, Business, Data Science, ..."
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 ${majorsError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
                {majorsError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />{majorsError}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
                <CustomDropdown
                  id="category"
                  value={category}
                  onChange={handleCategoryChange}
                  options={[
                    { value: 'Uni Students', label: 'Uni Students' },
                    { value: 'Professional', label: 'Professional' }
                  ]}
                  placeholder="Select category"
                  icon={Briefcase}
                  error={categoryError}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-slate-500">Note: This event is only for uni students.</p>
                {categoryError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {categoryError}
                  </p>
                )}
              </div>

              {/* LinkedIn (optional) */}
              <div className="space-y-2">
                <label htmlFor="linkedin" className="text-sm font-medium text-slate-700">LinkedIn (optional)</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="linkedin"
                    type="url"
                    value={linkedin}
                    onChange={handleLinkedinChange}
                    placeholder="https://www.linkedin.com/in/username"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 ${linkedinError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    disabled={loading}
                  />
                </div>
                {linkedinError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />{linkedinError}</p>
                )}
              </div>

              {/* Bio (optional) */}
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium text-slate-700">Profile bio (optional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={handleBioChange}
                    rows={3}
                    placeholder="A short description about you (max 500 characters)"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 resize-none ${bioError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                    maxLength={500}
                    disabled={loading}
                  />
                </div>
                {bioError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />{bioError}</p>
                )}
              </div>

              {/* Consent */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={handleConsentChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#10142c] focus:ring-[#10142c]"
                    disabled={loading}
                    required
                  />
                  <label htmlFor="consent" className="text-sm text-slate-700">
                    I am a university student and eligible to participate in this event.
                  </label>
                </div>
                {consentError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />{consentError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2
                  ${
                    !isFormValid || loading
                      ? "bg-[#4B4F63] text-gray-300 cursor-not-allowed"
                      : "bg-[#10142c] text-white hover:shadow-xl hover:-translate-y-1"
                  }`}
              >
                {loading ? "Saving..." : "Complete Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
