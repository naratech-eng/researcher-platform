import { Activity } from "lucide-react";

export default function BehaviorPage() {
  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Behavior Analysis</h1>
        <p className="text-muted-foreground">Analyze animal behavior patterns and insights</p>
      </div>
      <div className="flex h-96 items-center justify-center">
        <div className="space-y-4 text-center">
          <Activity className="mx-auto h-16 w-16 text-primary" />
          <p className="text-muted-foreground">Behavior analysis tools coming soon</p>
        </div>
      </div>
    </div>
  );
}
