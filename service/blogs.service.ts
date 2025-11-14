import { IBlog } from '@/types'

export const getBlogs = async () => {
	try {
		const response = await fetch('/api/blogs')
		if (!response.ok) throw new Error('Failed to fetch blogs')

		const blogs = await response.json()
		return blogs as IBlog[]
	} catch (error) {
		console.error('Error fetching blogs:', error)
		return []
	}
}

export const getDetailedBlog = async (slug: string) => {
	try {
		const response = await fetch(`/api/blogs/${slug}`)
		if (!response.ok) {
			if (response.status === 404) throw new Error('Blog not found')
			throw new Error('Failed to fetch blog')
		}

		const blog = await response.json()
		return blog as IBlog
	} catch (error) {
		console.error('Error fetching blog:', error)
		throw error
	}
}

export const createBlog = async (blogData: Omit<IBlog, 'id' | 'createdAt'>) => {
	try {
		const response = await fetch('/api/blogs', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(blogData),
		})

		if (!response.ok) throw new Error('Failed to create blog')

		const blog = await response.json()
		return blog as IBlog
	} catch (error) {
		console.error('Error creating blog:', error)
		throw error
	}
}

export const updateBlog = async (id: string, blogData: Partial<IBlog>) => {
	try {
		const response = await fetch(`/api/blogs/${id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(blogData),
		})

		if (!response.ok) throw new Error('Failed to update blog')

		const blog = await response.json()
		return blog as IBlog
	} catch (error) {
		console.error('Error updating blog:', error)
		throw error
	}
}

export const deleteBlog = async (id: string) => {
	try {
		const response = await fetch(`/api/blogs/${id}`, {
			method: 'DELETE',
		})

		if (!response.ok) throw new Error('Failed to delete blog')

		return await response.json()
	} catch (error) {
		console.error('Error deleting blog:', error)
		throw error
	}
}
