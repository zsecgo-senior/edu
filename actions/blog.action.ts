import { connectToDatabase } from '@/lib/mongoose'
import Blog from '@/database/blog.model'
import { auth } from '@/lib/serverAuth'

export const getBlogs = async () => {
	try {
		await connectToDatabase()

		const blogs = await Blog.find()
			.populate('author', 'name image bio')
			.sort({ createdAt: -1 })

		return JSON.parse(JSON.stringify(blogs))
	} catch (error) {
		console.log(error)
		throw error
	}
}

export const getBlogBySlug = async (slug: string) => {
	try {
		await connectToDatabase()

		const blog = await Blog.findOne({ slug }).populate(
			'author',
			'name image bio'
		)

		if (!blog) throw new Error('Blog not found')

		return JSON.parse(JSON.stringify(blog))
	} catch (error) {
		console.log(error)
		throw error
	}
}

export const createBlog = async (blogData: any) => {
	try {
		await connectToDatabase()

		const { userId } = auth()
		if (!userId) throw new Error('Unauthorized')

		const blog = await Blog.create({
			...blogData,
			author: userId,
		})

		return JSON.parse(JSON.stringify(blog))
	} catch (error) {
		console.log(error)
		throw error
	}
}

export const updateBlog = async (blogId: string, blogData: any) => {
	try {
		await connectToDatabase()

		const { userId } = auth()
		if (!userId) throw new Error('Unauthorized')

		const blog = await Blog.findById(blogId)
		if (!blog) throw new Error('Blog not found')
		if (blog.author.toString() !== userId) throw new Error('Unauthorized')

		const updatedBlog = await Blog.findByIdAndUpdate(
			blogId,
			{ ...blogData },
			{ new: true }
		).populate('author', 'name image bio')

		return JSON.parse(JSON.stringify(updatedBlog))
	} catch (error) {
		console.log(error)
		throw error
	}
}

export const deleteBlog = async (blogId: string) => {
	try {
		await connectToDatabase()

		const { userId } = auth()
		if (!userId) throw new Error('Unauthorized')

		const blog = await Blog.findById(blogId)
		if (!blog) throw new Error('Blog not found')
		if (blog.author.toString() !== userId) throw new Error('Unauthorized')

		await Blog.findByIdAndDelete(blogId)

		return { message: 'Blog deleted successfully' }
	} catch (error) {
		console.log(error)
		throw error
	}
}
