import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export function auth() {
	try {
		const token = cookies().get('token')?.value
		if (!token) return { userId: null }
		const decoded: any = jwt.verify(
			token,
			process.env.JWT_SECRET || 'dev_secret'
		)
		console.log(decoded)
		return { userId: decoded.id }
	} catch (e) {
		return { userId: null }
	}
}
