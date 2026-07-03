#!/bin/bash
set -e

export PORT=3000
pnpm --filter @workspace/api-server run dev &
API_PID=$!

export PORT=5000
pnpm --filter @workspace/kid-store run dev &
FRONTEND_PID=$!

wait $API_PID $FRONTEND_PID
