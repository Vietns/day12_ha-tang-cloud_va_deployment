# Deployment Information

## Project

Day06-E403-NhomB3 productionized for Day 12 deployment.

## Local Test

```cmd
npm start
curl http://localhost:5173/health
curl http://localhost:5173/ready
curl -X POST http://localhost:5173/api/moni/chat -H "X-API-Key: dev-key-change-me-in-production" -H "Content-Type: application/json" -d "{\"message\":\"Hello\"}"
curl -X POST http://localhost:5173/ask -H "X-API-Key: dev-key-change-me-in-production" -H "Content-Type: application/json" -d "{\"question\":\"Can you review my budget?\"}"
curl "http://localhost:5173/api/moni/history?userId=demo_user&month=2026-06" -H "X-API-Key: dev-key-change-me-in-production"
```

## Railway Deploy

```cmd
railway init
railway add --service moni
railway variables set ENVIRONMENT=production --service moni
railway variables set AGENT_API_KEY=dev-key-change-me-in-production --service moni
railway variables set RATE_LIMIT_PER_MINUTE=20 --service moni
railway variables set DAILY_BUDGET_USD=5.0 --service moni
railway up --service moni
railway domain --service moni
```

## Functional Requirements

- Agent answers questions through REST API: `POST /ask` and `POST /api/moni/chat`.
- Conversation history is stored per `userId` and `month`, and can be checked with `GET /api/moni/history`.
- Streaming responses are optional and are not implemented in this version.

## Public URL

To be filled after Railway deployment.
