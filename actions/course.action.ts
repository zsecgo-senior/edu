'use server'

import Course from '@/database/course.model'
import { connectToDatabase } from '@/lib/mongoose'
import {
	GetAllCoursesParams,
	GetCoursesParams,
	GetPaginationParams,
	ICreateCourse,
} from './types'
import { ICourse, ILesson } from '@/app.types'
import { revalidatePath } from 'next/cache'
import User from '@/database/user.model'
import { cache } from 'react'
import Section from '@/database/section.model'
import Lesson from '@/database/lesson.model'
import { calculateTotalDuration } from '@/lib/utils'
import { FilterQuery } from 'mongoose'
import Purchase from '@/database/purchase.model'
import UserProgress from '@/database/user-progress.model'
import Review from '@/database/review.model'

// Helper to resolve a user by either clerkId or Mongo _id
async function resolveUserByIdOrClerkId(idOrClerkId: string) {
	let user = await User.findOne({ clerkId: idOrClerkId })
	if (!user && /^[0-9a-fA-F]{24}$/.test(idOrClerkId)) {
		user = await User.findById(idOrClerkId)
	}
	return user
}

export const createCourse = async (data: ICreateCourse, _id: string) => {
	try {
		await connectToDatabase()
		// Resolve instructor by clerkId or Mongo _id
		const user = await resolveUserByIdOrClerkId(_id)
		if (!user) throw new Error('Instructor user not found')

		// Basic validation for incoming course data
		if (!data || typeof data !== 'object') {
			throw new Error('Invalid course data')
		}

		await Course.create({ ...data, instructor: user._id })
		revalidatePath('/en/instructor/my-courses')
	} catch (error) {
		throw new Error(
			'Something went wrong while creating course: ' +
				((error as Error)?.message || String(error))
		)
	}
}

export const getCourses = async (params: GetCoursesParams) => {
	try {
		await connectToDatabase()
		const { clerkId, page = 1, pageSize = 3 } = params

		const skipAmount = (page - 1) * pageSize

		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) throw new Error('User not found')
		const { _id } = user
		const courses = await Course.find({ instructor: _id })
			.skip(skipAmount)
			.limit(pageSize)
			.populate({
				path: 'instructor',
				select: 'fullName picture clerkId',
				model: User,
			})

		const totalCourses = await Course.find({ instructor: _id }).countDocuments()
		const isNext = totalCourses > skipAmount + courses.length

		const allCourses = await Course.find({ instructor: _id })
			.select('purchases currentPrice')
			.populate({
				path: 'purchases',
				model: Purchase,
				select: 'course',
				populate: {
					path: 'course',
					model: Course,
					select: 'currentPrice',
				},
			})

		const totalStudents = allCourses
			.map(c => c.purchases.length)
			.reduce((a, b) => a + b, 0)

		const totalEearnings = allCourses
			.map(c => c.purchases)
			.flat()
			.map(p => p.course.currentPrice)
			.reduce((a, b) => a + b, 0)

		return { courses, isNext, totalCourses, totalEearnings, totalStudents }
	} catch (error) {
		console.error('Error in getCourses:', error)
		throw new Error(
			`Something went wrong while getting course! ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		)
	}
}

export const getCourseById = async (id: string) => {
	try {
		await connectToDatabase()
		const course = await Course.findById(id)
		return course as ICourse
	} catch (error) {
		throw new Error('Soething went wrong while getting course!')
	}
}

export const updateCourse = async (
	id: string,
	updateData: Partial<ICourse>,
	path: string
) => {
	try {
		await connectToDatabase()
		await Course.findByIdAndUpdate(id, updateData)
		revalidatePath(path)
	} catch (error) {
		throw new Error('Something went wrong while updating course status!')
	}
}

export const deleteCourse = async (id: string, path: string) => {
	try {
		await connectToDatabase()
		await Course.findByIdAndDelete(id)
		revalidatePath(path)
	} catch (error) {
		throw new Error('Something went wrong while deleting course!')
	}
}

export const getFeaturedCourses = cache(async () => {
	try {
		await connectToDatabase()
		const courses = await Course.find({ published: true })
			.limit(6)
			.sort({ createdAt: -1 })
			.select('previewImage title slug oldPrice currentPrice instructor')
			.populate({
				path: 'instructor',
				select: 'fullName picture clerkId',
				model: User,
			})

		return courses
	} catch (error) {
		throw new Error('Something went wrong while getting featured courses!')
	}
})

export const getDetailedCourse = cache(async (id: string) => {
	try {
		await connectToDatabase()

		const course = await Course.findById(id)
			.select(
				'title description instructor previewImage oldPrice currentPrice learning requirements tags updatedAt level category language'
			)
			.populate({
				path: 'instructor',
				select: 'fullName picture clerkId',
				model: User,
			})

		const sections = await Section.find({ course: id }).populate({
			path: 'lessons',
			model: Lesson,
		})

		const totalLessons: ILesson[] = sections
			.map(section => section.lessons)
			.flat()

		const reviews = await Review.find({ course: id, isFlag: false }).select(
			'rating'
		)

		const rating = reviews.reduce((total, review) => total + review.rating, 0)

		const purchasedStudents = await Purchase.find({
			course: id,
		}).countDocuments()

		const calcRating = (rating / reviews.length).toFixed(1)

		const data = {
			...course._doc,
			totalLessons: totalLessons.length,
			totalSections: sections.length,
			totalDuration: calculateTotalDuration(totalLessons),
			rating: calcRating === 'NaN' ? 0 : calcRating,
			reviewCount: reviews.length,
			purchasedStudents,
		}

		return data
	} catch (error) {
		throw new Error('Something went wrong while getting detailed course!')
	}
})

export const getAllCourses = async (params: GetAllCoursesParams) => {
	try {
		await connectToDatabase()
		const { searchQuery, filter, page = 1, pageSize = 6 } = params

		const skipAmount = (page - 1) * pageSize

		const query: FilterQuery<typeof Course> = {}

		if (searchQuery) {
			query.$or = [{ title: { $regex: new RegExp(searchQuery, 'i') } }]
		}

		let sortOptions = {}

		switch (filter) {
			case 'newest':
				sortOptions = { createdAt: -1 }
				break
			case 'popular':
				sortOptions = { students: -1 }
				break
			case 'lowest-price':
				sortOptions = { currentPrice: 1 }
				break
			case 'highest-price':
				sortOptions = { currentPrice: -1 }
				break
			case 'english':
				query.language = 'english'
				break
			case 'uzbek':
				query.language = 'uzbek'
				break
			case 'russian':
				query.language = 'russian'
				break
			case 'turkish':
				query.language = 'turkish'
				break
			case 'beginner':
				query.level = 'beginner'
				break
			case 'intermediate':
				query.level = 'intermediate'
				break
			case 'advanced':
				query.level = 'advanced'
				break
			default:
				break
		}

		const courses = await Course.find(query)
			.select('previewImage title slug _id oldPrice currentPrice instructor')
			.populate({
				path: 'instructor',
				select: 'fullName picture clerkId',
				model: User,
			})
			.skip(skipAmount)
			.limit(pageSize)
			.sort(sortOptions)

		const totalCourses = await Course.countDocuments(query)
		const isNext = totalCourses > skipAmount + courses.length

		return { courses, isNext, totalCourses }
	} catch (error) {
		throw new Error('Something went wrong!')
	}
}

export const purchaseCourse = async (course: string, clerkId: string) => {
	try {
		await connectToDatabase()
		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) throw new Error('User not found')
		const checkCourse = await Course.findById(course)
			.select('purchases')
			.populate({
				path: 'purchases',
				model: Purchase,
				match: { user: user._id },
			})

		if (checkCourse.purchases.length > 0)
			return JSON.parse(JSON.stringify({ status: 200 }))

		const purchase = await Purchase.create({ user: user._id, course })

		await Course.findByIdAndUpdate(course, {
			$push: { purchases: purchase._id },
		})

		return JSON.parse(JSON.stringify({ status: 200 }))
	} catch (error) {
		throw new Error('Something went wrong while purchasing course!')
	}
}

export const getDashboardCourse = async (clerkId: string, courseId: string) => {
	try {
		await connectToDatabase()
		const course = await Course.findById(courseId).select('title')
		const sections = await Section.find({ course: courseId })
			.select('title')
			.sort({ position: 1 })
			.populate({
				path: 'lessons',
				model: Lesson,
				select: 'title userProgress',
				options: { sort: { position: 1 } },
				populate: {
					path: 'userProgress',
					match: { userId: clerkId },
					model: UserProgress,
					select: 'lessonId',
				},
			})

		const lessons = sections.map(section => section.lessons).flat()
		const lessonIds = lessons.map(lesson => lesson._id)

		const validCompletedLessons = await UserProgress.find({
			userId: clerkId,
			lessonId: { $in: lessonIds },
			isCompleted: true,
		})

		const progressPercentage =
			(validCompletedLessons.length / lessons.length) * 100

		return { course, sections, progressPercentage }
	} catch (error) {
		throw new Error('Something went wrong while getting dashboard course!')
	}
}

export const addFavoriteCourse = async (courseId: string, clerkId: string) => {
	try {
		await connectToDatabase()
		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) throw new Error('User not found')
		const isFavourite = await User.findOne({
			_id: user._id,
			favouriteCourses: courseId,
		})

		if (isFavourite) {
			throw new Error('Course already added to favorite')
		}

		await User.findByIdAndUpdate(user._id, {
			$push: { favouriteCourses: courseId },
		})
	} catch (error) {
		throw new Error('Something went wrong while adding favorite course!')
	}
}

export const addArchiveCourse = async (courseId: string, clerkId: string) => {
	try {
		await connectToDatabase()
		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) throw new Error('User not found')
		const isArchive = await User.findOne({
			_id: user._id,
			archiveCourses: courseId,
		})

		if (isArchive) {
			throw new Error('Course already added to archive')
		}

		await User.findByIdAndUpdate(user._id, {
			$push: { archiveCourses: courseId },
		})
	} catch (error) {
		throw new Error('Something went wrong while adding favorite course!')
	}
}

export const addWishlistCourse = async (courseId: string, clerkId: string) => {
	try {
		await connectToDatabase()
		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) throw new Error('User not found')
		const isWhishlist = await User.findOne({
			_id: user._id,
			wishlistCourses: courseId,
		})

		if (isWhishlist) {
			throw new Error('Course already added to archive')
		}

		await User.findByIdAndUpdate(user._id, {
			$push: { wishlistCourses: courseId },
		})
	} catch (error) {
		throw new Error('Something went wrong while adding whishlist!')
	}
}

export const getIsPurchase = async (clerkId: string, courseId: string) => {
	try {
		await connectToDatabase()
		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) throw new Error('User not found')
		const isPurchased = await Purchase.findOne({
			user: user._id,
			course: courseId,
		})

		return !!isPurchased
	} catch (error) {
		throw new Error('Something went wrong while getting purchased courses!')
	}
}

export const getProgressCourse = async (clerkId: string, courseId: string) => {
	try {
		await connectToDatabase()

		const sections = await Section.find({ course: courseId }).populate({
			path: 'lessons',
			model: Lesson,
			options: { sort: { order: 1 } },
		})

		const lessons = sections.map(section => section.lessons).flat()
		const lessonIds = lessons.map(lesson => lesson._id)

		const validCompletedLessons = await UserProgress.find({
			userId: clerkId,
			lessonId: { $in: lessonIds },
			isCompleted: true,
		})

		const progressPercentage =
			(validCompletedLessons.length / lessons.length) * 100

		return progressPercentage
	} catch (error) {
		return 0
	}
}

export const getStudentCourse = async (clerkId: string) => {
	try {
		await connectToDatabase()
		// clerkId may actually be a MongoDB _id depending on auth() implementation.
		// Try to resolve user by clerkId first, then fallback to findById.
		let user = await User.findOne({ clerkId }).select('_id')
		if (!user) {
			// if clerkId looks like an ObjectId, try findById
			if (/^[0-9a-fA-F]{24}$/.test(clerkId)) {
				user = await User.findById(clerkId).select('_id')
			}
		}

		if (!user) {
			throw new Error('User not found for this clerkId or id!')
		}

		const purchasedCourses = await Purchase.find({ user: user._id }).populate({
			path: 'course',
			model: Course,
			select: 'title price _id previewImage slug category currentPrice',
		})

		const courses = purchasedCourses.filter(el => el.course !== null)

		const allCourses = []

		for (const item of courses) {
			if (!item.course || !item.course._id) continue
			const progress = await getProgressCourse(clerkId, item.course._id)
			allCourses.push({ ...item._doc, progress })
		}

		const expenses =
			allCourses.length > 0
				? allCourses
						.map(c => c.course.currentPrice || 0)
						.reduce((a, b) => a + b, 0)
				: 0

		return { allCourses, expenses }
	} catch (error) {
		throw new Error(
			(error as any)?.message ||
				'Something went wrong while getting student courses!'
		)
	}
}

export const getWishlist = async (clerkId: string) => {
	try {
		await connectToDatabase()
		const user = await resolveUserByIdOrClerkId(clerkId)
		if (!user) return []

		const wishlistCourses = await Course.find({
			_id: { $in: user.wishlistCourses },
		})
			.select('previewImage title slug oldPrice currentPrice instructor')
			.populate({
				path: 'instructor',
				select: 'fullName picture clerkId',
				model: User,
			})

		return wishlistCourses
	} catch (error) {
		throw new Error('Something went wrong while getting whishlist!')
	}
}

export const getAdminCourses = async (params: GetPaginationParams) => {
	try {
		await connectToDatabase()
		const { page = 1, pageSize = 3 } = params

		const skipAmount = (page - 1) * pageSize

		const courses = await Course.find()
			.skip(skipAmount)
			.limit(pageSize)
			.sort({ createdAt: -1 })
			.populate('instructor previewImage title')
			.populate({
				path: 'instructor',
				select: 'fullName picture clerkId',
				model: User,
			})

		const totalCourses = await Course.countDocuments()
		const isNext = totalCourses > skipAmount + courses.length

		return { courses, isNext, totalCourses }
	} catch (error) {
		throw new Error('Something went wrong while getting admin courses!')
	}
}
