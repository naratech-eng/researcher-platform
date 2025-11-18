import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="space-y-6 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">404</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Out of bounds</h1>
            <p className="text-muted-foreground">
              The page you’re looking for doesn’t exist. Head back to the control center to continue your work.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go back
            </Button>
            <Button onClick={() => navigate("/")}>Return to dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
