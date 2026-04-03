import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  // Validar redirect: solo rutas relativas internas (previene open redirect)
  const redirectTo =
    redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/'

  return <LoginForm redirectTo={redirectTo} />
}
