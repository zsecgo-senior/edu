'use client'

import { Button } from '@/components/ui/button'
import useTranslate from '@/hooks/use-translate'
import { FaRegCreditCard } from 'react-icons/fa'
import { useState } from 'react'

function AddPaymentMethod() {
	const t = useTranslate()
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<Button
				className='mx-auto w-fit'
				size={'lg'}
				rounded={'full'}
				onClick={() => setIsOpen(true)}
			>
				<span>{t('addPaymentMethod')}</span>
				<FaRegCreditCard className='ml-2' />
			</Button>

			{isOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center'>
					<div
						className='absolute inset-0 bg-black/50'
						onClick={() => setIsOpen(false)}
					/>
					<div className='relative w-full max-w-md rounded bg-white p-6'>
						<h2 className='text-lg font-bold mb-2'>{t('addPaymentMethod')}</h2>
						<p className='mb-4'>
							Payments are disabled in this build. Stripe integration has been
							removed.
						</p>
						<div className='flex justify-end'>
							<Button onClick={() => setIsOpen(false)}>Close</Button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default AddPaymentMethod
