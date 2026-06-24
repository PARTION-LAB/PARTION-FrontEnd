const AUTH_REDIRECT_PATHS = ['/auth', '/login', '/signup', '/password-reset', '/oauth']

function isAuthPath(path) {
  return AUTH_REDIRECT_PATHS.some((authPath) => (
    path === authPath ||
    path.startsWith(`${authPath}/`) ||
    path.startsWith(`${authPath}?`) ||
    path.startsWith(`${authPath}#`)
  ))
}

export function normalizeAuthRedirect(value) {
  const redirect = Array.isArray(value) ? value[0] : value

  if (typeof redirect !== 'string') {
    return ''
  }

  const trimmedRedirect = redirect.trim()

  if (!trimmedRedirect || !trimmedRedirect.startsWith('/') || trimmedRedirect.startsWith('//')) {
    return ''
  }

  try {
    const baseOrigin = globalThis.location?.origin || 'http://localhost'
    const url = new URL(trimmedRedirect, baseOrigin)

    if (url.origin !== baseOrigin) {
      return ''
    }

    const safePath = `${url.pathname}${url.search}${url.hash}`
    return isAuthPath(safePath) ? '' : safePath
  } catch {
    return ''
  }
}
