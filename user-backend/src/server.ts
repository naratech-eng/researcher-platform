import { serve } from "bun";
import "dotenv/config";
import { registerUser } from "./routes/users";

serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/register" && req.method === "POST") {
      return registerUser(req);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`User backend running on http://localhost:${process.env.PORT ?? 3000}`);
