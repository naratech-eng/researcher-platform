import { useState } from "react";
import {
  Beaker,
  FlaskConical,
  Activity,
  Brain,
  Dna,
  Play,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ResearchPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");

  const metrics = [
    { title: "Active Studies", value: "24", icon: Activity, color: "text-primary" },
    { title: "Total Animals", value: "1,847", icon: Dna, color: "text-accent" },
    { title: "AI Insights", value: "156", icon: Brain, color: "text-secondary" },
    { title: "Experiments", value: "89", icon: FlaskConical, color: "text-primary" },
  ];

  const activeSessions = [
    { name: "Study-2024-A", environment: "RStudio", status: "Running", duration: "2h 34m" },
    { name: "GenomeAnalysis", environment: "Jupyter", status: "Running", duration: "1h 12m" },
  ];

  const quickLaunchPresets = [
    { name: "Genome Sequencing", environment: "RStudio", description: "Pre-configured for DNA analysis" },
    { name: "Behavior Analytics", environment: "Jupyter", description: "Python ML pipeline ready" },
    { name: "Statistical Modeling", environment: "RStudio", description: "R packages for statistical tests" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Research Environment</h1>
        <p className="text-muted-foreground">Access your data analysis tools and manage active sessions</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Currently running research environments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSessions.length > 0 ? (
            activeSessions.map((session) => (
              <div key={session.name} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">{session.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{session.environment}</Badge>
                    <span className="text-sm text-muted-foreground">{session.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {session.status}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No active sessions</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Launch Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Quick Launch Presets
          </CardTitle>
          <CardDescription>Start pre-configured research environments</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quickLaunchPresets.map((preset) => (
            <div key={preset.name} className="space-y-3 rounded-lg border p-4 transition-colors hover:border-primary">
              <div className="space-y-1">
                <h4 className="font-semibold">{preset.name}</h4>
                <p className="text-sm text-muted-foreground">{preset.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{preset.environment}</Badge>
                <Button size="sm">Launch</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Environment Selection & Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>Launch Custom Environment</CardTitle>
          <CardDescription>Select and configure your research environment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Environment Type</label>
              <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rstudio">RStudio Server</SelectItem>
                  <SelectItem value="jupyter">Jupyter Notebook</SelectItem>
                  <SelectItem value="vscode">VS Code Server</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button disabled={!selectedEnvironment} className="w-32">
                <Play className="mr-2 h-4 w-4" />
                Launch
              </Button>
            </div>
          </div>

          {selectedEnvironment && (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border bg-muted/30 p-6">
              <div className="space-y-4 text-center">
                <Beaker className="mx-auto h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedEnvironment === "rstudio" && "RStudio"}
                    {selectedEnvironment === "jupyter" && "Jupyter Notebook"}
                    {selectedEnvironment === "vscode" && "VS Code"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">Click Launch to start your environment</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
