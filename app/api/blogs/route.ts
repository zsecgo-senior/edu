import { NextResponse } from 'next/server'
import { getBlogs } from '@/actions/blog.action'

export async function GET() {
	try {
		const blogs = await getBlogs()
		return NextResponse.json(blogs)
	} catch (error: any) {
		return NextResponse.json({ message: error.message }, { status: 500 })
	}
}
