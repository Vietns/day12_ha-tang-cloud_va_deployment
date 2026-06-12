const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;

function read(file) {
  return fs.existsSync(path.join(root, file))
    ? fs.readFileSync(path.join(root, file), "utf8")
    : "";
}

function check(name, passed, detail = "") {
  const icon = passed ? "OK" : "FAIL";
  console.log(`  ${icon} ${name}${detail ? ` - ${detail}` : ""}`);
  return passed;
}

const server = read("codebase/server.js");
const dockerfile = read("Dockerfile");
const dockerignore = read(".dockerignore");
const gitignore = read(".gitignore");
const railway = read("railway.toml");
const envExample = read(".env.example");

console.log("\nProduction Readiness Check - Day06 Project\n");

const results = [
  check("Dockerfile exists", fs.existsSync(path.join(root, "Dockerfile"))),
  check(".dockerignore exists", fs.existsSync(path.join(root, ".dockerignore"))),
  check(".env.example exists", fs.existsSync(path.join(root, ".env.example"))),
  check("railway.toml exists", fs.existsSync(path.join(root, "railway.toml"))),
  check("package.json exists", fs.existsSync(path.join(root, "package.json"))),
  check(".env ignored", gitignore.includes(".env")),
  check(".dockerignore covers .env", dockerignore.includes(".env")),
  check("PORT env supported", server.includes("process.env.PORT")),
  check("Health endpoint defined", server.includes('"/health"')),
  check("Readiness endpoint defined", server.includes('"/ready"')),
  check("REST ask endpoint defined", server.includes('"/ask"')),
  check("API key authentication implemented", server.includes("verifyApiKey")),
  check("Conversation history implemented", server.includes("getConversationHistory")),
  check("Conversation history endpoint defined", server.includes("/api/moni/history")),
  check("Rate limiting implemented", server.includes("checkRateLimit")),
  check("Cost guard implemented", server.includes("checkBudget")),
  check("Structured JSON logging implemented", server.includes("JSON.stringify(record)")),
  check("Graceful shutdown implemented", server.includes("SIGTERM")),
  check("Docker healthcheck exists", dockerfile.includes("HEALTHCHECK")),
  check("Railway healthcheck configured", railway.includes("healthcheckPath")),
  check("AGENT_API_KEY in env example", envExample.includes("AGENT_API_KEY")),
  check("Google AI supported", server.includes("google_ai") && read("codebase/server/openaiClient.js").includes("callGoogleAIForToolSelection")),
];

const passed = results.filter(Boolean).length;
console.log(`\nResult: ${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
