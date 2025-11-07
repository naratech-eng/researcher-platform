import { serve } from "bun";
import "dotenv/config";
import { connectDB, closeDB } from "./db";
import { register, login, metamaskAuth, didAuth, getProfile } from "./routes/auth";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

async function startServer() {
  try {
    await connectDB();

    serve({
      port: PORT,
      async fetch(req) {
        const url = new URL(req.url);
        const origin = req.headers.get("origin");

        if (req.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: corsHeaders(origin),
          });
        }

        let response: Response;

        if (url.pathname === "/api/auth/register" && req.method === "POST") {
          response = await register(req);
        } else if (url.pathname === "/api/auth/login" && req.method === "POST") {
          response = await login(req);
        } else if (url.pathname === "/api/auth/metamask" && req.method === "POST") {
          response = await metamaskAuth(req);
        } else if (url.pathname === "/api/auth/did" && req.method === "POST") {
          response = await didAuth(req);
        } else if (url.pathname === "/api/auth/profile" && req.method === "GET") {
          const authHeader = req.headers.get("authorization");
          if (!authHeader) {
            response = Response.json({ error: "Unauthorized" }, { status: 401 });
          } else {
            const token = authHeader.replace("Bearer ", "");
            response = await getProfile(req, token);
          }
        } else if (url.pathname === "/health") {
          response = Response.json({ status: "ok", timestamp: new Date().toISOString() });
        } else {
          response = Response.json({ error: "Not Found" }, { status: 404 });
        }

        Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      },
    });

    console.log(`✅ User backend running on http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   POST /api/auth/register`);
    console.log(`   POST /api/auth/login`);
    console.log(`   POST /api/auth/metamask`);
    console.log(`   POST /api/auth/did`);
    console.log(`   GET  /api/auth/profile`);
    console.log(`   GET  /health`);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down gracefully...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n👋 Shutting down gracefully...");
  await closeDB();
  process.exit(0);
});

startServer();
