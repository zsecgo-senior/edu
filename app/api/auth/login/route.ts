import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/mongoose'
import User from '@/database/user.model'

export async function POST(req: Request) {
	await connectToDatabase()
	const body = await req.json()
	const { email, password } = body

	if (!email || !password) {
		return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
	}

	const user = await User.findOne({ email })
	if (!user)
		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

	const match = bcrypt.compareSync(password, user.passwordHash || '')
	if (!match)
		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

	const token = jwt.sign(
		{ id: user._id },
		process.env.JWT_SECRET || 'dev_secret',
		{
			expiresIn: '7d',
		}
	)

	const secure = process.env.NODE_ENV === 'production'

	const res = NextResponse.json({
		success: true,
		user: { id: user._id, email: user.email, fullName: user.fullName },
	})
	res.headers.set(
		'Set-Cookie',
		`token=${token}; HttpOnly; Path=/; Max-Age=${
			7 * 24 * 60 * 60
		}; SameSite=Lax; ${secure ? 'Secure;' : ''}`
	)
	return res
}
