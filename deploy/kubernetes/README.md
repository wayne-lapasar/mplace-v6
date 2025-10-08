# Kubernetes Blueprint

- Use `apps/api/deployment.yaml` (to be created) for Bun container.
- Configure ConfigMap + Secret for runtime configuration.
- Enable HorizontalPodAutoscaler hooking into metrics adapter.
- Expose via Ingress or Gateway API with TLS termination.
