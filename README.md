# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Datadog RUM

This app initializes Datadog Browser RUM from `src/observability/datadogRum.js` with the Vue plugin and Vue error tracking.

Required production environment variables:

```bash
VITE_DATADOG_RUM_APPLICATION_ID=
VITE_DATADOG_RUM_CLIENT_TOKEN=
VITE_DATADOG_RUM_SITE=ap1.datadoghq.com
VITE_DATADOG_RUM_SERVICE=partion-frontend
VITE_DATADOG_RUM_ENV=prod
```

Optional variables:

```bash
VITE_DATADOG_RUM_ENABLED=true
VITE_DATADOG_RUM_VERSION=
VITE_DATADOG_RUM_SESSION_SAMPLE_RATE=100
VITE_DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE=0
VITE_DATADOG_RUM_PRIVACY_LEVEL=mask-user-input
VITE_DATADOG_ALLOWED_TRACING_URLS=
VITE_DATADOG_RUM_DEBUG=false
```

Leave `VITE_DATADOG_RUM_APPLICATION_ID` or `VITE_DATADOG_RUM_CLIENT_TOKEN` empty to skip RUM initialization locally. Set `VITE_DATADOG_ALLOWED_TRACING_URLS` to a comma-separated list of API origins only after the backend CORS policy allows Datadog trace headers.

For the production GitHub Actions deployment, add these secrets to the `production` environment:

```bash
VITE_DATADOG_RUM_APPLICATION_ID
VITE_DATADOG_RUM_CLIENT_TOKEN
```

The production deployment captures Datadog Session Replay for 100% of RUM sessions.
