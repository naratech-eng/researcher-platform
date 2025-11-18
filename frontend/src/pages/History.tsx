import { History as HistoryIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const mockHistory = [
  { id: "conv-184", title: "Genome drift deep dive", timestamp: "Today • 14:02" },
  { id: "conv-183", title: "Reward schedule tweaks", timestamp: "Yesterday • 21:47" },
  { id: "conv-182", title: "Behavior anomaly triage", timestamp: "Yesterday • 09:15" },
];

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Chat History</h1>
        <p className="text-muted-foreground">View your previous conversations with Emilia AI.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent conversations</CardTitle>
          <CardDescription>Hand-off threads and system-to-human escalations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockHistory.length ? (
            mockHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.timestamp}</p>
                </div>
                <button className="text-sm font-medium text-primary hover:underline">Open transcript</button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
              <HistoryIcon className="h-14 w-14" />
              <p>No chat history yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
