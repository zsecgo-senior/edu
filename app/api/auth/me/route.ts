import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/mongoose'
import User from '@/database/user.model'

function getTokenFromCookie(cookieHeader?: string | null) {
	if (!cookieHeader) return null
	const parts = cookieHeader.split(';').map(p => p.trim())
	for (const p of parts) {
		if (p.startsWith('token=')) return p.replace('token=', '')
	}
	return null
}

export async function GET(req: Request) {
	await connectToDatabase()
	const cookie = req.headers.get('cookie')
	const token = getTokenFromCookie(cookie)
	if (!token) return NextResponse.json({ user: null })

	try {
		const decoded: any = jwt.verify(
			token,
			process.env.JWT_SECRET || 'dev_secret'
		)
		const user = await User.findById(decoded.id).lean()
		if (!user) return NextResponse.json({ user: null })

		const u: any = user

		return NextResponse.json({
			user: {
				id: u._id,
				clerkId: u.clerkId || '',
				email: u.email,
				fullName: u.fullName,
				picture: u.picture,
				role: u.role,
				isAdmin: u.isAdmin,
				bio: u.bio || '',
				phone: u.phone || '',
				job: u.job || '',
				website: u.website || '',
				linkedin: u.linkedin || '',
				github: u.github || '',
				youtube: u.youtube || '',
				approvedInstructor: u.approvedInstructor || false,
			},
		})
	} catch (e) {
		return NextResponse.json({ user: null })
	}
}
