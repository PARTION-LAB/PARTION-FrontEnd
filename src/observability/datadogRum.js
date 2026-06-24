import { datadogRum } from '@datadog/browser-rum'
import { vuePlugin } from '@datadog/browser-rum-vue'

let isInitialized = false

const parseNumber = (value, fallback) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const parseBoolean = (value) => value === 'true'

const parseAllowedTracingUrls = (value) => {
  if (!value) {
    return undefined
  }

  const urls = value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)

  return urls.length > 0 ? urls : undefined
}

export const initDatadogRum = () => {
  const env = import.meta.env

  if (isInitialized || env.VITE_DATADOG_RUM_ENABLED === 'false') {
    return
  }

  const applicationId = env.VITE_DATADOG_RUM_APPLICATION_ID
  const clientToken = env.VITE_DATADOG_RUM_CLIENT_TOKEN
  const debugEnabled = parseBoolean(env.VITE_DATADOG_RUM_DEBUG)

  if (!applicationId || !clientToken) {
    if (debugEnabled) {
      console.info('[Datadog RUM] skipped because application id or client token is missing')
    }

    return
  }

  const sessionReplaySampleRate = parseNumber(
    env.VITE_DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
    0,
  )

  datadogRum.init({
    applicationId,
    clientToken,
    site: env.VITE_DATADOG_RUM_SITE || 'ap1.datadoghq.com',
    service: env.VITE_DATADOG_RUM_SERVICE || 'partion-frontend',
    env: env.VITE_DATADOG_RUM_ENV || env.MODE,
    version: env.VITE_DATADOG_RUM_VERSION || undefined,
    sessionSampleRate: parseNumber(env.VITE_DATADOG_RUM_SESSION_SAMPLE_RATE, 100),
    sessionReplaySampleRate,
    defaultPrivacyLevel: env.VITE_DATADOG_RUM_PRIVACY_LEVEL || 'mask-user-input',
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    allowedTracingUrls: parseAllowedTracingUrls(env.VITE_DATADOG_ALLOWED_TRACING_URLS),
    plugins: [vuePlugin()],
  })

  if (sessionReplaySampleRate > 0) {
    datadogRum.startSessionReplayRecording()
  }

  isInitialized = true
}
