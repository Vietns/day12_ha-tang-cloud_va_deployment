# Day 12 Lab - Mission Answers

## Part 1: Localhost vs Production

### Exercise 1.1: Anti-patterns found

1. Secrets are hardcoded in code: `OPENAI_API_KEY` and `DATABASE_URL`.
2. Secret value is printed to logs, which can leak credentials.
3. Port and host are hardcoded as `localhost:8000`.
4. `reload=True` and `DEBUG=True` are enabled, which are development settings.
5. There is no `/health` endpoint for platform health checks.
6. There is no `/ready` endpoint for readiness/load-balancer routing.
7. Configuration is not loaded from environment variables.
8. Logging uses `print()` instead of structured logs.
9. There is no graceful shutdown lifecycle.

### Exercise 1.2: Basic version result

The basic app runs locally, but it is not production-ready because it depends on local-only config, hardcoded secrets, debug behavior, and has no health/readiness checks.

Windows CMD test used:

```cmd
cd 01-localhost-vs-production\develop
python app.py
curl -X POST "http://localhost:8000/ask?question=Hello"
```

### Exercise 1.3: Comparison table

| Feature | Basic | Advanced | Why Important? |
|---------|-------|----------|----------------|
| Config | Hardcoded values | Environment variables via config | Works across local, Docker, and cloud |
| Secrets | In source code | Not logged; expected from env | Prevents credential leaks |
| Host/port | `localhost:8000` | `HOST` / `PORT`, supports `0.0.0.0` | Required for containers and Railway/Render |
| Health check | Missing | `GET /health` | Platform can detect broken containers |
| Readiness check | Missing | `GET /ready` | Load balancer only sends traffic when app is ready |
| Logging | `print()` | Structured JSON logging | Easier debugging and production observability |
| Shutdown | No lifecycle | Lifespan + SIGTERM handler | Allows graceful cleanup |
| Debug reload | Always enabled | Controlled by `DEBUG` | Avoids production instability |

Checkpoint 1: completed.

## Part 2: Docker

### Exercise 2.1: Dockerfile questions

1. Base image: `python:3.11`.
2. Working directory: `/app`.
3. `requirements.txt` is copied first to take advantage of Docker layer cache. Dependencies do not reinstall when only app code changes.
4. `CMD` provides the default command for the container and can be overridden. `ENTRYPOINT` defines the main executable and is harder to override.

### Exercise 2.2: Build and run

Develop image was built from project root because the Dockerfile copies files from root-level paths:

```cmd
docker build -f 02-docker\develop\Dockerfile -t my-agent .
docker run -p 8000:8000 my-agent
curl -X POST "http://localhost:8000/ask?question=What%20is%20Docker%3F"
```

Observation: the container ran successfully and answered from the mock LLM.

### Exercise 2.3: Multi-stage build

The production Dockerfile uses:

- Stage 1 `builder`: installs build tools and Python dependencies.
- Stage 2 `runtime`: copies only runtime packages and app code.

This makes the final image smaller and safer because compilers/build tools do not remain in the runtime image. It also runs as a non-root user and defines a Docker `HEALTHCHECK`.

### Exercise 2.4: Docker Compose stack

The production Compose stack defines:

- `agent`: FastAPI AI agent.
- `redis`: cache/session/rate-limit storage.
- `qdrant`: vector database for RAG patterns.
- `nginx`: reverse proxy and load balancer.

Architecture:

```text
Client -> Nginx -> Agent container(s)
                    |-> Redis
                    |-> Qdrant
```

Checkpoint 2: completed.

## Part 3: Cloud Deployment

### Exercise 3.1: Railway deployment

The final production agent was deployed successfully to Railway.

Public URL:

```text
https://agent-production-e6bd.up.railway.app
```

Test results:

```cmd
curl https://agent-production-e6bd.up.railway.app/health
```

Result:

```json
{"status":"ok","version":"1.0.0","environment":"production","checks":{"llm":"mock"}}
```

```cmd
curl https://agent-production-e6bd.up.railway.app/ready
```

Result:

```json
{"ready":true}
```

```cmd
curl -X POST https://agent-production-e6bd.up.railway.app/ask -H "X-API-Key: dev-key-change-me-in-production" -H "Content-Type: application/json" -d "{\"question\":\"What is Docker deployment?\"}"
```

Result: API returned an authenticated mock LLM answer.

### Exercise 3.2: Render vs Railway config

| Item | Railway `railway.toml` | Render `render.yaml` |
|------|-------------------------|----------------------|
| Platform style | Project/service config | Blueprint infrastructure config |
| Runtime | Dockerfile/start command | Docker or Python service definition |
| Health check | `healthcheckPath` | `healthCheckPath` |
| Env vars | Set via Railway CLI/dashboard | Defined in YAML or generated/dashboard secrets |
| Deployment flow | `railway up` | GitHub Blueprint deploy |

Checkpoint 3: completed.

## Part 4: API Security

### Exercise 4.1: API key authentication

API key validation is implemented with FastAPI dependency/security header logic. The protected endpoint requires:

```text
X-API-Key: <key>
```

If the key is missing, the API returns `401`. If the key is invalid, it returns an auth error. Key rotation can be done by changing `AGENT_API_KEY` in environment variables and restarting/redeploying the service.

Local test commands:

```cmd
cd 04-api-gateway\develop
set AGENT_API_KEY=my-secret-key
python app.py
curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d "{\"question\":\"Hello\"}"
curl -X POST http://localhost:8000/ask -H "X-API-Key: my-secret-key" -H "Content-Type: application/json" -d "{\"question\":\"Hello\"}"
```

### Exercise 4.2: JWT authentication

The production security example includes JWT flow in `04-api-gateway/production/auth.py`:

1. User posts credentials to `/token`.
2. Server validates credentials and signs a JWT.
3. Client calls protected routes using `Authorization: Bearer <token>`.
4. Server verifies signature and expiry before allowing access.

JWT is useful when sessions, user identity, and token expiry are needed instead of a single static API key.

### Exercise 4.3: Rate limiting

The rate limiter uses a sliding-window algorithm:

- User limit: `10` requests per `60` seconds.
- Admin limit: `100` requests per `60` seconds.
- When the limit is exceeded, the API returns `429 Too Many Requests`.

Admin bypass is handled by using a higher admin limiter bucket instead of the normal user limiter.

### Exercise 4.4: Cost guard

The cost guard estimates LLM cost from input/output tokens and tracks daily usage. It blocks users with `402 Payment Required` when a per-user budget is exceeded, and can return service errors if the global budget is exhausted.

Current implementation stores usage in memory for the teaching example. Production should store usage in Redis or a database so usage persists and works across multiple instances.

Checkpoint 4: completed.

## Part 5: Scaling & Reliability

### Exercise 5.1: Health checks

The reliability examples and final project expose:

- `GET /health`: liveness check.
- `GET /ready`: readiness check.

These let Docker, Railway, Render, and load balancers know whether to restart or route traffic to the app.

### Exercise 5.2: Graceful shutdown

The code handles shutdown through FastAPI lifespan logic and a `SIGTERM` handler. This lets the app stop accepting new traffic, finish in-flight work, and cleanly shut down when a container platform restarts or replaces it.

### Exercise 5.3: Stateless design

The correct production pattern is to avoid storing user state in process memory. Shared state should live in Redis or another external store so multiple agent instances can serve the same user reliably.

### Exercise 5.4: Load balancing

The production stack uses Nginx as a reverse proxy/load balancer in front of agent instances. With scaled agents, Nginx distributes requests across containers and can continue routing when one instance is replaced.

Example command:

```cmd
cd 05-scaling-reliability\production
docker compose up --scale agent=3
```

### Exercise 5.5: Stateless test

The provided `test_stateless.py` verifies that conversation/state behavior survives instance changes. The expected production result is that requests continue working after one instance is stopped because state is stored outside the process.

Checkpoint 5: completed conceptually and validated through the final project deployment:

- `/health` works.
- `/ready` works.
- Railway healthcheck passed.
- API is stateless enough for the mock final deployment.
- Docker Compose local stack and Railway deployment both run.

