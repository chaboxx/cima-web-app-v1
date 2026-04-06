const redirectUri =
  import.meta.env.VITE_COGNITO_REDIRECT_URI ||
  'https://cima-web-app-v1.vercel.app/'

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

export function buildCognitoLogoutUrl() {
  if (!cognitoDomain) return null

  const url = new URL('/logout', cognitoDomain)
  url.searchParams.set('client_id', cognitoAuthConfig.client_id)
  url.searchParams.set('logout_uri', logoutUri)
  return url.toString()
}
