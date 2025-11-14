import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/mongoose'
import Notification from '@/database/notification.model'

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
	if (!token) return NextResponse.json({ count: 0 })

	try {
		const decoded: any = jwt.verify(
			token,
			process.env.JWT_SECRET || 'dev_secret'
		)
		const userId = decoded.id
		const count = await Notification.countDocuments({
			user: String(userId),
			isRead: false,
		})
		return NextResponse.json({ count })
	} catch (e) {
		return NextResponse.json({ count: 0 })
	}
}
