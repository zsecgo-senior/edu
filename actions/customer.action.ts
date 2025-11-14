'use server'

import User from '@/database/user.model'
import { connectToDatabase } from '@/lib/mongoose'
// Stripe was removed from the project. These functions are kept as no-op
// fallbacks so other parts of the app that import them won't break.
import { revalidatePath } from 'next/cache'

export const createCustomer = async (userId: string) => {
	try {
		await connectToDatabase()
		// Stripe removed: no external customer is created.
		// Ensure user exists and clear any legacy customerId field.
		const user = await User.findById(userId).select('email fullName customerId')
		if (!user) throw new Error('User not found')
		if (user.customerId) {
			// clear legacy customerId
			await User.findByIdAndUpdate(userId, { $unset: { customerId: '' } })
		}

		// Return null to indicate no external customer was created.
		return null
	} catch (error) {
		throw new Error("Couldn't create customer: " + (error as Error).message)
	}
}

export const getCustomer = async (idOrClerkId: string) => {
	try {
		await connectToDatabase()
		// Try to resolve by clerkId first, then by Mongo _id
		let user = await User.findOne({ clerkId: idOrClerkId }).select(
			'customerId _id'
		)
		if (!user && /^[0-9a-fA-F]{24}$/.test(idOrClerkId)) {
			user = await User.findById(idOrClerkId).select('customerId _id')
		}

		if (!user) return null
		// If there was a legacy customerId, remove it
		if (user.customerId)
			await User.findByIdAndUpdate(user._id, { $unset: { customerId: '' } })
		return null
	} catch (error) {
		throw new Error(
			"Couldn't get customer details: " + (error as Error).message
		)
	}
}

export const atachPayment = async (
	paymentMethod: string,
	customer: string,
	path?: string
) => {
	try {
		path && revalidatePath(path)
		// Stripe removed: nothing to attach
		return null
	} catch (error) {
		const result = error as Error
		throw new Error(result.message)
	}
}

export const detachPaymentMethod = async (
	paymentMethod: string,
	path: string
) => {
	try {
		// Stripe removed: nothing to detach
		revalidatePath(path)
	} catch (error) {
		const result = error as Error
		throw new Error(result.message)
	}
}

export const getCustomerCards = async (idOrClerkId: string) => {
	try {
		await connectToDatabase()
		// Stripe removed: return empty list
		await getCustomer(idOrClerkId) // keep parity with previous flow (no-op)
		return []
	} catch (error) {
		const result = error as Error
		throw new Error(result.message)
	}
}

export const getPaymentIntents = async (clerkId: string) => {
	try {
		// Stripe removed: return empty list
		await getCustomer(clerkId)
		return []
	} catch (error) {
		const result = error as Error
		throw new Error(result.message)
	}
}
