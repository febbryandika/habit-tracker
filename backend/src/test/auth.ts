type AppLike = { request: (path: string, init?: RequestInit) => Response | Promise<Response> }

// Signs up a new user through the real better-auth endpoint and returns the
// session cookie string for use as the Cookie header in subsequent requests.
export async function signUpAndGetCookie(app: AppLike, email?: string) {
  const userEmail = email ?? `test-${Math.random().toString(36).slice(2)}@example.com`
  const res = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'password123', name: 'Test User' }),
  })
  if (!res.ok) throw new Error(`Sign-up failed: ${res.status} ${await res.text()}`)

  // Extract only the name=value part — drop Path, HttpOnly, etc.
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
  return { cookie, email: userEmail }
}
