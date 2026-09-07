import { createFileRoute } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Flemme</h1>

        <Button>Start Cooking</Button>
      </div>
    </main>
  );
}
