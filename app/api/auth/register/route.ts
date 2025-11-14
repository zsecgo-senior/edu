import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '@/lib/mongoose'
import User from '@/database/user.model'

export async function POST(req: Request) {
	await connectToDatabase()
	const body = await req.json()
	const { fullName, email, password } = body

	if (!email || !password) {
		return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
	}

	const existing = await User.findOne({ email }).lean()
	if (existing) {
		return NextResponse.json({ error: 'User already exists' }, { status: 409 })
	}

	const salt = bcrypt.genSaltSync(10)
	const hash = bcrypt.hashSync(password, salt)

	const user = await User.create({ fullName, email, passwordHash: hash })

	// Create JWT
	const token = jwt.sign(
		{ id: user._id },
		process.env.JWT_SECRET || 'dev_secret',
		{
			expiresIn: '7d',
		}
	)

	const secure = process.env.NODE_ENV === 'production'

	const res = NextResponse.json(
		{
			success: true,
			user: { id: user._id, email: user.email, fullName: user.fullName },
		},
		{ status: 201 }
	)
	res.headers.set(
		'Set-Cookie',
		`token=${token}; HttpOnly; Path=/; Max-Age=${
			7 * 24 * 60 * 60
		}; SameSite=Lax; ${secure ? 'Secure;' : ''}`
	)
	return res
}
