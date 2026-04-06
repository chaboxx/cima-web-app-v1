const redirectUri =
  import.meta.env.VITE_COGNITO_REDIRECT_URI ||
  'https://cima-web-app-v1.vercel.app'

const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI || redirectUri

export const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || ''

export const cognitoAuthConfig = {
  authority:
    import.meta.env.VITE_COGNITO_AUTHORITY ||
    'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_McunVYsu8',
  client_id:
    import.meta.env.VITE_COGNITO_CLIENT_ID || '2e63itd99mnv9a09i7vjp5hh00',
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: import.meta.env.VITE_COGNITO_SCOPE || 'phone openid email',
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}

export function clearOidcSessionStorage(clientId = cognitoAuthConfig.client_id) {
  const oidcPrefixes = [
    `oidc.user:${cognitoAuthConfig.authority}:${clientId}`,
    `oidc.${clientId}`,
  ]

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keysToDelete = []

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (!key) continue

      if (oidcPrefixes.some((prefix) => key.startsWith(prefix))) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => storage.removeItem(key))
  }
}

export function buildCognitoLogoutUrl({ redirectToLogin = false } = {}) {
  if (!cognitoDomain) return null

  const url = new URL('/logout', cognitoDomain)

  if (redirectToLogin) {
    url.searchParams.set('client_id', cognitoAuthConfig.client_id)
    url.searchParams.set('response_type', cognitoAuthConfig.response_type)
    url.searchParams.set('redirect_uri', cognitoAuthConfig.redirect_uri)
    url.searchParams.set('scope', cognitoAuthConfig.scope)
    return url.toString()
  }

  url.searchParams.set('client_id', cognitoAuthConfig.client_id)
  url.searchParams.set('logout_uri', logoutUri)
  return url.toString()
}
