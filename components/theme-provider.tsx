import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { toast } from "react-hot-toast"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

type RubricFile = {
  id: string;
  name: string;
  type: "pdf" | "markdown";
  uploadDate: string;
  size: string;
  isActive: boolean;
};

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
    // Use a random id generated on the client only
    const newRubric: RubricFile = {
      id: crypto.randomUUID(), // Use crypto.randomUUID() for unique id
      name: file.name,
      type: file.name.endsWith(".pdf") ? "pdf" : "markdown",
      uploadDate: new Date().toISOString().split("T")[0],
      size: `${Math.round(file.size / 1024)} KB`,
      isActive: false,
    }

    setRubrics((prev) => [...prev, newRubric])
    toast.success(`${file.name} has been uploaded successfully.`)
  }
}
function setRubrics(arg0: (prev: any) => any[]) {
    throw new Error("Function not implemented.");
}

