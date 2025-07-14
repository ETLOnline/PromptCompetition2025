"use client";

import { useState } from "react";
import {
  Users, FileText, Award, Settings,
  Lock, Unlock, Play, Plus, Upload, LogOut
} from "lucide-react";
import {
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Badge,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui";   // adjust import paths if you tree-shake primitives

/* extra UI primitives */
import { Input }             from "@/components/ui/input";
import { Select,
         SelectTrigger,
         SelectContent,
         SelectItem,
         SelectValue }       from "@/components/ui/select";

/* ---------- AdminDashboard ---------- */
export default function AdminDashboard() {
  /** 1 ▼  dummy data ----------------------------------------------------- */
  const [participants, setParticipants] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Participant ${i + 1}`,
      email: `user${i + 1}@example.com`,
      score: +(Math.random() * 100).toFixed(1),
      status: Math.random() > 0.4 ? "Active" : "Inactive",
    }))
  );
  
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "review">("all");
  const [topCount, setTopCount]         = useState(10);

  const [problems, setProblems] = useState(
    ["Classify Customer Feedback", "Generate Code Docs", "Summarise Meetings"].map(
      (title, i) => ({
        id: i + 1,
        title,
        description: `Draft description for “${title}”`,
      })
    )
  );

  const [rubrics, setRubrics] = useState(
    ["Accuracy / 40", "Clarity / 20", "Robustness / 40"].map((title, i) => ({
      id: i + 1,
      title: `Rubric ${i + 1}`,
      criteria: title,
    }))
  );

  const [results, setResults] = useState(
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      participant: `Participant ${i + 1}`,
      problem: problems[i % problems.length].title,
      score: +(Math.random() * 100).toFixed(1),
    }))
  );

  /** 2 ▼  global controls ------------------------------------------------ */
  const [submissionsLocked, setSubmissionsLocked] = useState(false);
  const toggleLock = () => setSubmissionsLocked((s) => !s);
  const triggerEvaluation = () =>
    console.log("🔗  LLM evaluation trigger fired (stub)");

  /** 3 ▼  tab-specific helpers ------------------------------------------ */
  const addProblem = () =>
    setProblems((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        title: `Problem ${prev.length + 1}`,
        description: "New problem description",
      },
    ]);

  const uploadRubric = () =>
    setRubrics((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        title: `Rubric ${prev.length + 1}`,
        criteria: "Uploaded rubric criteria",
      },
    ]);

  /** 4 ▼  derived stats -------------------------------------------------- */
  const stats = {
    totalParticipants: participants.length,
    submissions: results.length,
    evaluated: results.filter((r) => r.score > 0).length,
    pending: 658, // placeholder
  };

  /* ----------  UI  ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-red-300 text-red-700 px-3 py-1">
              ADMIN
            </Badge>
            <button className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            ["Total Participants", stats.totalParticipants, Users],
            ["Submissions", stats.submissions, FileText],
            ["Evaluated", stats.evaluated, Award],
            ["Pending", stats.pending, Settings],
          ].map(([label, value, Icon]) => (
            <Card key={label as string} className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#b0ffe6] rounded-t-lg flex justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-800">{label}</CardTitle>
                <Icon className="h-4 w-4 text-gray-700" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* controls */}
        <Card className="shadow-md mb-10">
          <CardHeader>
            <CardTitle>Competition Controls</CardTitle>
            <CardDescription>Lock submissions or launch batch evaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={toggleLock}
                className={
                  submissionsLocked
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#56ffbc] text-gray-900 hover:bg-[#45e0a6]"
                }
              >
                {submissionsLocked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Submissions
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Submissions
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={triggerEvaluation}
                className="border-[#56ffbc] hover:bg-[#e6fff6]"
              >
                <Play className="h-4 w-4 mr-2" />
                Trigger LLM Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* tabs */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-lg overflow-hidden">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="rubrics">Rubrics</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Participants */}
          <TabsContent value="participants">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>All registered users.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#d3fff1]">
                    <tr>
                      {["ID", "Name", "Email", "Score", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participants.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{p.id}</td>
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.email}</td>
                        <td className="px-4 py-2 text-center">{p.score}</td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={
                              p.status === "Active"
                                ? "border-green-300 text-green-700"
                                : "border-yellow-300 text-yellow-700"
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Problems */}
          <TabsContent value="problems">
            <Card className="shadow-md">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle>Problems</CardTitle>
                  <CardDescription>Create or modify challenges.</CardDescription>
                </div>
                <Button onClick={addProblem} className="bg-[#56ffbc] text-gray-900 hover:bg-[#45e0a6]">
                  <Plus className="h-4 w-4 mr-2" /> Add Problem
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {problems.map((prob) => (
                  <div key={prob.id} className="p-4 border rounded-md bg-white hover:shadow">
                    <h4 className="font-semibold">{prob.title}</h4>
                    <p className="text-sm text-gray-600">{prob.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rubrics */}
          <TabsContent value="rubrics">
            <Card className="shadow-md">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle>Rubrics</CardTitle>
                  <CardDescription>Upload or edit evaluation rubrics.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={uploadRubric}
                  className="border-[#56ffbc] hover:bg-[#e6fff6]"
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Rubric
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {rubrics.map((r) => (
                  <div key={r.id} className="p-4 border rounded-md bg-white hover:shadow">
                    <h4 className="font-semibold">{r.title}</h4>
                    <p className="text-sm text-gray-600">{r.criteria}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results */}
        <TabsContent value="results">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Top Submissions</CardTitle>
              <CardDescription>
                View and manually review the highest-scoring submissions
              </CardDescription>
            </CardHeader>

            {/* --- controls ------------------------------------------------------- */}
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* search */}
                <Input
                  placeholder="Search submissions…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-60"
                />

                {/* status filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                  </SelectContent>
                </Select>

                {/* top-N selector */}
                <Select value={topCount.toString()} onValueChange={(v) => setTopCount(+v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Top 10" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        Top {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* --- table -------------------------------------------------------- */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#d3fff1]">
                    <tr>
                      {["#", "Participant", "Problem", "Score", "Status"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results
                      /* apply filters */
                      .filter((r) =>
                        statusFilter === "all" ? true : r.status === statusFilter
                      )
                      .filter((r) =>
                        [r.participant, r.problem, r.score.toString()]
                          .join(" ")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      /* sort and slice */
                      .sort((a, b) => b.score - a.score)
                      .slice(0, topCount)
                      .map((res, idx) => (
                        <tr key={res.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{idx + 1}</td>
                          <td className="px-4 py-2">{res.participant}</td>
                          <td className="px-4 py-2">{res.problem}</td>
                          <td className="px-4 py-2">{res.score}</td>
                          <td className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={
                                res.status === "submitted"
                                  ? "border-green-300 text-green-700"
                                  : "border-yellow-300 text-yellow-700"
                              }
                            >
                              {res.status === "submitted" ? "Submitted" : "Under Review"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
