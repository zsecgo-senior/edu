import { NextResponse, NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

// i18n middleware

const intlMiddleware = createMiddleware({
	locales: ['en', 'ru', 'uz', 'tr'],
	defaultLocale: 'uz',
	localePrefix: 'always',
})

const PUBLIC_ROUTES = [
	'/:lng',
	'/:lng/courses',
	'/:lng/course/:slug',
	'/:lng/blogs',
	'/:lng/blogs/:slug',
	'/:lng/contacts',
	'/:lng/instructors',
	'/:lng/instructors/:instructorId',
	'/:lng/shopping/cart',
	'/:lng/auth/sign-in',
	'/:lng/auth/sign-up',
	'/:lng/ai',
	// webhook routes removed
	'/api/blogs(.*)',
	'/api/uploadthing',
]

export default function middleware(req: NextRequest) {
	const pathname = req.nextUrl.pathname

	// API routelar uchun i18n middleware ishlamasin
	if (pathname.startsWith('/api')) {
		return NextResponse.next()
	}

	// Run the i18n middleware for non-API routes
	const maybeResponse = intlMiddleware(req)
	if (maybeResponse) return maybeResponse

	// Allow API webhooks and static/next internals
	if (pathname.startsWith('/api/webhook') || pathname.startsWith('/_next')) {
		return NextResponse.next()
	}

	// Simple auth check: if token cookie exists, consider authenticated.
	// Full verification happens on the server-side actions.
	const token = req.cookies.get('token')?.value

	// If route is public, continue
	const isPublic = PUBLIC_ROUTES.some(routePattern => {
		// naive check: replace :lng with a segment wildcard
		const pattern = routePattern.replace(':lng', '[^/]+')
		try {
			const re = new RegExp('^' + pattern + '$')
			return re.test(pathname)
		} catch (e) {
			return false
		}
	})

	if (isPublic) return NextResponse.next()

	// Protected route: if no token, redirect to sign-in
	if (!token) {
		const locale = pathname.split('/')[1] || 'uz'
		const signInUrl = new URL(`/${locale}/auth/sign-in`, req.url)
		signInUrl.searchParams.set('redirect_url', req.url)
		return NextResponse.redirect(signInUrl)
	}

	return NextResponse.next()
	// ...existing code...
}

// Middleware ishlaydigan routelar
export const config = {
	matcher: [
		'/((?!_next|.*\\.[\\w]+$).*)', // Static fayllar va Next.js ichki routelaridan tashqari
		'/',
		'/api/:path*',
	],
}
