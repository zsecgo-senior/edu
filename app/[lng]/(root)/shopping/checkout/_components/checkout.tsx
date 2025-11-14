'use client'

import { purchaseCourse } from '@/actions/course.action'
import { sendNotification } from '@/actions/notification.action'
// payment actions removed (payments disabled)
import { ICard } from '@/app.types'
import FillLoading from '@/components/shared/fill-loading'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/hooks/use-cart'
import useTranslate from '@/hooks/use-translate'
import { addressSchema } from '@/lib/validation'
import useUser from '@/hooks/use-user'
// Stripe client removed
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { z } from 'zod'

interface Props {
	cards: ICard[]
	coupon: number
}
function Checkout({ cards, coupon }: Props) {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [radioValue, setRadioValue] = useState<string>('0')

	useEffect(() => {
		if (cards.length === 0) {
			setRadioValue(`${cards.length + 1}`)
		}
	}, [cards])

	// stripe/elements not available — payments are disabled
	const { totalPrice, taxes, carts, clearCart } = useCart()
	const t = useTranslate()
	const { user } = useUser()
	const router = useRouter()

	const onSubmit = async (_values: z.infer<typeof addressSchema>) => {
		// Payments are disabled after removing Stripe. As a fallback,
		// proceed to directly purchase the courses (no payment).
		setLoading(true)
		try {
			await paymentIntent('no-payment')
		} catch (error) {
			setLoading(false)
			const result = error as Error
			setError(result.message)
		}
	}

	const onSavedCard = (paymentMethod: string) => {
		setLoading(true)
		try {
			paymentIntent(paymentMethod)
		} catch (error) {
			setLoading(false)
			const result = error as Error
			setError(result.message)
		}
	}

	const paymentIntent = async (_paymentMethod: string) => {
		setLoading(true)
		try {
			// Directly mark courses as purchased (no payment).
			for (const course of carts) {
				await purchaseCourse(course._id, user?.clerkId!)
				await sendNotification(course.instructor.clerkId, 'messageCourseSold')
			}
			await sendNotification(user?.clerkId!, 'messageCoursePurchased')
			router.push(`/shopping/success?pi=no-payment`)
			setTimeout(clearCart, 5000)
		} catch (error) {
			setLoading(false)
			const result = error as Error
			setError(result.message)
		}
	}

	return (
		<>
			{loading && <FillLoading />}
			{error && (
				<Alert variant='destructive' className='mb-4 mt-2'>
					<AlertCircle className='size-4' />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<RadioGroup onValueChange={setRadioValue} value={radioValue}>
				<div className='flex flex-col space-y-3'>
					{cards.map((card, i) => (
						<div
							key={card.id}
							className='flex items-center justify-between border bg-secondary p-4'
						>
							<div>
								<div className='flex items-center gap-2'>
									<RadioGroupItem value={`${i}`} id={`${i}`} />
									<Label
										htmlFor={`${i}`}
										className='font-space-grotesk font-bold capitalize'
									>
										{card.billing_details.name} |
									</Label>
									<p className='font-space-grotesk text-sm font-bold'>
										{card.card.brand} {card.card.last4}
									</p>
								</div>
								<div className='ml-6 font-space-grotesk text-sm font-bold'>
									{t('expDate')} {card.card.exp_month}/{card.card.exp_year}
								</div>
							</div>

							{radioValue === `${i}` && (
								<div className='flex justify-end'>
									<Button
										className='group max-md:w-full'
										type='button'
										onClick={() => onSavedCard(card.id)}
										disabled={loading}
									>
										<span>
											{t('payNow')}{' '}
											{(totalPrice(coupon) + taxes()).toLocaleString('en-US', {
												style: 'currency',
												currency: 'USD',
											})}
										</span>
										<ArrowRight className='ml-1 size-4 transition-transform group-hover:translate-x-1' />
									</Button>
								</div>
							)}
						</div>
					))}

					<div className='flex items-center gap-2 border bg-secondary p-4'>
						<RadioGroupItem
							value={`${cards.length + 1}`}
							id={`${cards.length + 1}`}
						/>
						<Label
							htmlFor={`${cards.length + 1}`}
							className='font-space-grotesk font-bold capitalize'
						>
							{t('newCreditCard')}
						</Label>
					</div>
				</div>
			</RadioGroup>

			{radioValue === `${cards.length + 1}` && (
				<form
					onSubmit={e => {
						e.preventDefault()
						// pass dummy values to onSubmit
						onSubmit({
							address: '',
							city: '',
							fullName: user?.fullName || '',
							zip: '',
						} as any)
					}}
				>
					<div className='p-4'>
						<p className='mb-2'>
							Payments are disabled. Click the button below to complete the
							purchase without payment.
						</p>
						<Button type='submit' disabled={loading}>
							{t('payNow')}
						</Button>
					</div>
				</form>
			)}
		</>
	)
}

export default Checkout
