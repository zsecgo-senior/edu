import { NextRequest, NextResponse } from 'next/server'
import { getBlogBySlug } from '@/actions/blog.action'

export async function GET(
	req: NextRequest,
	{ params }: { params: { slug: string } }
) {
	try {
		const blog = await getBlogBySlug(params.slug)
		return NextResponse.json(blog)
	} catch (error: any) {
		return NextResponse.json(
			{ message: error.message },
			{ status: error.message === 'Blog not found' ? 404 : 500 }
		)
	}
}
