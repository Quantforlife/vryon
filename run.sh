#!/usr/bin/env bash
# Installs deps if needed, then starts Vite on the first free port (Vite auto-increments from 5173).
[ -d node_modules ] || npm install
npm run dev
