import { NextResponse } from 'next/server'

export async function POST() {
	const res = NextResponse.json({ success: true })
	res.headers.set(
		'Set-Cookie',
		`token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;`
	)
	return res
}
