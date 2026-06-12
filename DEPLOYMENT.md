# Deployment Information

## Public URL

https://agent-production-e6bd.up.railway.app

## Platform

Railway

## Test Commands

### Health Check

```cmd
curl https://agent-production-e6bd.up.railway.app/health
```

Expected:

```json
{"status":"ok"}
```

### Readiness Check

```cmd
curl https://agent-production-e6bd.up.railway.app/ready
```

Expected:

```json
{"ready":true}
```

### Authentication Required

```cmd
curl -X POST https://agent-production-e6bd.up.railway.app/ask -H "Content-Type: application/json" -d "{\"question\":\"Hello\"}"
```

Expected: `401 Unauthorized`.

### API Test With Authentication

```cmd
curl -X POST https://agent-production-e6bd.up.railway.app/ask -H "X-API-Key: dev-key-change-me-in-production" -H "Content-Type: application/json" -d "{\"question\":\"What is Docker deployment?\"}"
```

Expected: JSON response with `question`, `answer`, `model`, and `timestamp`.

## Environment Variables Set

- `ENVIRONMENT=production`
- `AGENT_API_KEY=dev-key-change-me-in-production`
- `JWT_SECRET=dev-jwt-secret-change-in-production`
- `RATE_LIMIT_PER_MINUTE=20`
- `DAILY_BUDGET_USD=5.0`
- `PORT` is provided by Railway.
- `OPENAI_API_KEY` is intentionally empty; the app uses mock LLM for this lab.

## Validation Results

Public Railway tests passed:

```text
/health -> status ok, environment production, llm mock
/ready  -> ready true
/ask    -> authenticated mock LLM answer
```

