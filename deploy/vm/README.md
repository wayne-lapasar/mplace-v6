# VM Deployment Notes

- Provision Bun runtime and MongoDB/Redis dependencies.
- Configure process manager (systemd/PM2) to run `bun run apps/api/src/main.ts`.
- Point reverse proxy (Nginx/Caddy) to Bun server port.
