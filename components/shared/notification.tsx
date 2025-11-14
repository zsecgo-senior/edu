'use client'

import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import useUser from '@/hooks/use-user'

function Notification() {
	const [count, setCount] = useState(0)

	const { user } = useUser()

	useEffect(() => {
		let mounted = true

		const fetchCount = async () => {
			try {
				const res = await fetch('/api/notifications/count')
				const data = await res.json()
				if (mounted) setCount(data.count || 0)
			} catch (error) {
				if (mounted) setCount(0)
			}
		}

		if (user) fetchCount()

		return () => {
			mounted = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user])

	return (
		<Button
			size={'icon'}
			variant={count === 0 ? 'ghost' : 'secondary'}
			asChild
			className='relative'
			aria-label='notification-btn'
		>
			<Link href={'/profile/notifications'} aria-label='notification-btn'>
				<Bell />
				{count > 0 && (
					<div className='absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive'>
						{count}
					</div>
				)}
			</Link>
		</Button>
	)
}

export default Notification
