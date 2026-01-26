import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Linkedin,
  Award,
  Sparkles,
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Meet Our Judges - All Pakistan Prompt Engineering Competition 2025",
  description: "Meet the distinguished panel of judges for APPEC 2025 - accomplished professionals, researchers, and innovators from Pakistan's tech and education sectors.",
}

// Judge data array
const judges = [
  {
    id: 1,
    name: "Dr. Saima Hassan",
    title: "Assistant Professor, Institute of Computing, KUST & VP of Agentic Education, MindHYVE.ai",
    bio: "I am Dr. Saima Hassan, an Assistant Professor at the Institute of Computing, KUST, with a PhD in Information Technology from Universiti Teknologi PETRONAS, Malaysia. Alongside academia, I serve as the Vice President of Agentic Education at MindHYVE.ai, where I lead the rollout of ArthurAI™ and work to strengthen AI literacy and industry–academia collaboration across institutions. I am also a UNDP Innovation Award recipient for my startup idea Smart Learnify. I was honored with a nomination for the U.S. IVLP (International Visitor Leadership Program) — recognitions that reflect my commitment to educational innovation, leadership, and impact. Beyond my professional roles, I am deeply motivated by empowering young learners, especially women, to explore technology with confidence and curiosity, believing that true progress comes when innovation and inclusion grow together.",
    linkedin: "https://www.linkedin.com/in/drsaima-hassan/",
    placeholder: "/images/judges/Saima-Hassan.png",
    expertise: ["AI Education", "Innovation", "Research"]
  },
  {
    id: 2,
    name: "Komal Syed",
    title: "Chief Product Officer",
    bio: "Product lead with an M.Ed in Technology, Innovation and Education from Harvard and prior studies at LUMS. She drives product workflows, partner integrations, and field demos, translating pedagogy into reliable tech delivery at scale.",
    linkedin: "https://www.linkedin.com/in/komal-ashraf-syed-bb487a14",
    placeholder: "/images/judges/komal-syed.png",
    expertise: ["Product Management", "EdTech", "Innovation"]
  },
  {
    id: 3,
    name: "Zafar Iqbal",
    title: "CTO & Director, Symtera Technologies Pvt. Ltd.",
    bio: "I am Zafar Iqbal, CTO & Director at Symtera Technologies Pvt. Ltd., with 17+ years of experience in cloud, cybersecurity, IT infrastructure, and an AI enthusiast and digital innovation promoter. I hold an MSCS degree from ITU along with multi-domain certifications, and I am an entrepreneur, startup mentor, and strong supporter of emerging founders, driving AI-powered digital transformation across industries. I'm also a nature-loving explorer who believes creativity grows through curiosity and new experiences.",
    linkedin: "https://www.linkedin.com/in/ziqbal452",
    placeholder: "/images/judges/zafar-iqbal.png",
    expertise: ["Cloud & Cybersecurity", "AI Innovation", "Digital Transformation"]
  },
  {
    id: 4,
    name: "Masood Khan",
    title: "Global Supply Chain & Business Leader, LinkedIn Top Voice (2024)",
    bio: "Masood Khan is a Global Supply Chain & Business Leader and LinkedIn Top Voice (2024) who brings over 20 years of global business strategy experience from Fortune 100 companies. As an AI & Sustainability Strategist specializing in transforming logistics and operations, he focuses on applying AI to core business challenges. Masood is the author of 2 books, including a #1 New Release on Amazon, 'Sustainability Rewired: Pioneering the Future,' as well as 'Beginner to Executive Prompting Guide,' and a podcaster and guest lecturer at universities. His real-world global business experience informs his approach to designing role-specific prompt engineering use cases that transform how professionals work across industries. Masood serves as an AI Hackathon Judge and, with his keen eye for turning technical capabilities into business value, combines practical frameworks with strategic vision.",
    linkedin: "https://www.linkedin.com/in/masoodkhan100",
    placeholder: "/images/judges/masood-khan.png",
    expertise: ["AI Strategy", "Supply Chain", "Author & Speaker"]
  },
  {
    id: 5,
    name: "Kashif Ahmed",
    title: "Seasoned Business and Technology Leader",
    bio: "Kashi Ahmed is a seasoned business and technology leader who has steered multi-million-dollar CRM and cloud transformations for Fortune 500 clients. Backed by over two decades of experience in enterprise-level IT strategy and architecture, he pairs deep technical rigor with board-level business insight. Kashi holds a B.S. in Computer Engineering, an M.S. in Computer Science, a Graduate Certificate in Leadership, and executive-education credentials from MIT Sloan. His passion for AI, Web3, and cloud automation drives thought-leadership that reaches thousands of professionals each month. You'll also find him passionately mentoring students and professionals, volunteering at non-profit events, and speaking on digital-innovation panels. A collaborative business partner, change agent, self-motivator, result-oriented leader, and a creative strategist whose career history has been consistently characterized by exceptional performance in each venture undertaken. Soft skills include; superb oral and written communication skills, ability to present information to all levels appropriately, and leading technology teams.",
    linkedin: "https://www.linkedin.com/in/kashidhq",
    placeholder: "/images/judges/kashif-ahmad.png",
    expertise: ["Enterprise IT", "Cloud & Web3", "Mentorship"]
  },
  {
    id: 6,
    name: "Dr. Zulfiqar Ali Mir",
    title: "Experienced AI Software Developer and Educator",
    bio: "Proven ability to deliver engaging lessons that foster critical thinking, problem-solving, and analytical skills. Proficient in business intelligence tools (Power BI, Tableau) and dimensional modeling. Strong background in quantitative developer, analyst, and management accounting within the fields of economics and finance, leveraging analytical skills to drive business decisions. Specializes in IGCSE and A-Level math curricula. Experienced AI Software Developer and Founder at an AI Startup | Mathematics & Statistics Educator | Data Science, Machine Learning, AI, Econometrics Expert | Quantitative Developer & Analyst | Management Accounting Specialist | Full Stack Developer | Cloud-Native Generative AI Engineer | News Paper Writer",
    linkedin: "https://www.linkedin.com/in/zulfiqar-ali-mir/",
    placeholder: "/images/judges/Zulfiqar-Ali-Mir.png",
    expertise: ["AI Development", "Data Science", "Education"]
  }
  ,
  {
    id: 7,
    name: "Akber Choudhry",
    title: "Principal Cloud Architect (AWS/GCP/Azure) | AI & DevOps Leader | Modernizing Legacy Systems",
    bio: "Akber Choudhry is a Principal Cloud Architect and AI/DevOps leader who modernizes legacy, monolith, and on‑prem systems into cloud‑native and microservices architectures. With 20+ years of experience, he combines hands‑on delivery—building pipelines, writing Terraform, and mentoring teams—with architectural leadership. He is fluent across AWS, Google Cloud, and Azure, and brings a DevSecOps mindset where security and operations are treated as code. Akber leads pragmatic MLOps and Generative AI initiatives that drive measurable business value and has delivered globally across regulated environments in Canada, the US, UK, and Europe.",
    linkedin: "https://www.linkedin.com/in/akberc/",
    placeholder: "/images/judges/akber-chaudary.png",
    expertise: [
      "AWS | GCP | Azure",
      "Terraform & DevSecOps",
      "MLOps & Generative AI",
      "Legacy Modernization",
      "Architecture Leadership"
    ]
  },
  {
    id: 8,
    name: "Muhammad Mohsin Siddiqui",
    title: "Chief Architect | CTO | Technology Leader | Engineering Manager | Agile Coach",
    bio: `I am an accomplished engineering leader with 20+ years of experience in the software industry, including more than a decade in engineering management and 6 years in executive leadership roles. My expertise lies in driving innovation and scalability, mentoring engineering teams, and delivering high-quality enterprise B2B SaaS products. As a Certified Scrum Master and Agile coach, I have successfully fostered collaborative, high-performing teams. In 2018, I was promoted to Chief Technology Officer at Elixir Technologies.

At Elixir, I played a key role in designing and developing Elixir Tango, the first SaaS platform in the Customer Communications Management (CCM) space. I traveled globally (US, Europe, ME, and APAC) to meet clients, conduct training sessions, and represented Elixir at multiple developer conferences.

In 2021, I joined Imarat Group of Companies & Graana.com as VP of Engineering, leading the digital transformation initiatives and optimising software development processes for multiple products. I restructured and scaled the engineering team, introduced Agile Scrum practices, and implemented modern DevOps methodologies to improve cost efficiency, performance, and delivery timelines. Leveraging cloud-native technologies like microservices, Docker, and Kubernetes, I streamlined development workflows and enabled faster, high-quality software delivery.

Currently, I am working with the digital transformation team at Zones, architecting a scalable digital platform for B2B e-commerce portals. This involves designing future-ready systems to align with business goals, enhance operational efficiency, and deliver exceptional user experiences.

As hands-on leader, I stay updated with the latest technologies and contribute directly to code. My technical background spans C++, Java, and JavaScript, with recent expertise in modern stacks such as ReactJS, React Native, Node.js. And more recently I'm also working with Python (for AI projects), and Golang (for data-intensive, high-performance, scalable systems).

In addition to technical expertise, I am passionate about fostering a learning culture and co-creating technology roadmaps that inspire teams to innovate. I share insights through articles and speeches, empowering teams and organisations to achieve their potential.`,
    linkedin: "https://www.linkedin.com/in/mohsinsiddiqui/",
    placeholder: "/images/judges/mohsin-siddiqui.jpg",
    expertise: [
      "Engineering Leadership",
      "Enterprise SaaS",
      "Agile & Scrum",
      "Cloud-Native Architecture",
      "DevOps & CI/CD",
      "Digital Transformation",
      "Microservices & Kubernetes",
      "Full Stack Development",
      "AI & Data Engineering"
    ]
  },
]

export default function JudgesPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 opacity-60"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-20"></div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 border border-blue-200">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Expert Panel</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight px-2">
                Meet Our
                <span className="block mt-2 pb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Esteemed Judges
                </span>
              </h1>

              {/* Intro Copy */}
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  Our judges are top AI professionals, educators, and innovators dedicated to fair, insightful evaluation. Their expertise ensures every participant is recognized for creativity, clarity, and impact. Connect, learn, and be inspired by the best in Pakistan&apos;s tech community.
                </p>
            </div>
          </div>
        </section>

        {/* Judges Grid Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            {/* Judge Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {judges.map((judge) => (
                <Card 
                  key={judge.id}
                  className="border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-white group flex flex-col"
                >
                  <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                    {/* Judge Photo */}
                    <div className="mx-auto mb-3 sm:mb-4 relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Image
                          src={judge.placeholder}
                          alt={judge.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Status indicator */}
                      <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>

                    {/* Name & Title */}
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2" style={{ color: '#0f172a' }}>
                      {judge.name}
                    </CardTitle>
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-3">
                      {judge.title}
                    </p>

                    {/* Expertise Tags */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mb-3 sm:mb-4">
                      {judge.expertise.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium bg-gradient-to-r from-blue-50 to-green-50 text-gray-700 rounded-full border border-blue-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-grow space-y-3 sm:space-y-4 p-4 sm:p-6">
                    {/* Biography */}
                    <div className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-6 group-hover:line-clamp-none transition-all duration-300 flex-grow">
                      {judge.bio}
                    </div>

                    {/* LinkedIn Button */}
                    <Link 
                      href={judge.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button 
                        className="w-full text-white transition-all duration-300 group/btn relative overflow-hidden text-xs sm:text-sm"
                        style={{ backgroundColor: '#0f172a' }}
                        size="sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover/btn:translate-x-[200%] transition-transform duration-700"></div>
                        <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 relative z-10" />
                        <span className="relative z-10">Connect on LinkedIn</span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Our Judges Matter Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 mb-4">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-semibold text-blue-600">Excellence in Evaluation</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
                Why Our Judges Matter
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                Learn how our expert panel ensures fair evaluation and meaningful mentorship
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Industry Experience */}
              <Card className="border-2 border-transparent hover:border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                    <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#0f172a' }}>
                    Industry Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center leading-relaxed">
                    Our judges bring decades of combined experience from Fortune 100 companies, startups, 
                    and leading tech organizations, ensuring real-world relevance in every evaluation.
                  </p>
                </CardContent>
              </Card>

              {/* Academic Excellence */}
              <Card className="border-2 border-transparent hover:border-green-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#0f172a' }}>
                    Academic Excellence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center leading-relaxed">
                    With PhDs, Harvard degrees, and MIT credentials, our panel combines rigorous academic 
                    standards with practical pedagogy to nurture emerging talent.
                  </p>
                </CardContent>
              </Card>

              {/* Innovation Focus */}
              <Card className="border-2 border-transparent hover:border-purple-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="mx-auto mb-3 sm:mb-4 p-3 sm:p-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#0f172a' }}>
                    Innovation Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center leading-relaxed">
                    As award-winning innovators, authors, and thought leaders, our judges recognize 
                    creative solutions that push the boundaries of AI and prompt engineering.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  )
}
