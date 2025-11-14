import { IUser } from '@/app.types'
import { useEffect, useState } from 'react'

const useUser = () => {
	const [user, setUser] = useState<IUser | null>(null)

	useEffect(() => {
		let mounted = true
		const fetchUser = async () => {
			try {
				const res = await fetch('/api/auth/me')
				const data = await res.json()

				if (mounted) {
					if (!data.user) {
						setUser(null)
					} else {
						// map server user shape to IUser
						const s = data.user
						const mapped: IUser = {
							_id: s.id,
							clerkId: s.clerkId || '',
							fullName: s.fullName || '',
							email: s.email || '',
							picture: s.picture || '',
							role: s.role || 'user',
							bio: s.bio || '',
							phone: s.phone || '',
							job: s.job || '',
							website: s.website || '',
							linkedin: s.linkedin || '',
							github: s.github || '',
							youtube: s.youtube || '',
							approvedInstructor: s.approvedInstructor || false,
							isAdmin: s.isAdmin || false,
						}
						setUser(mapped)
					}
				}
			} catch (err) {
				if (mounted) setUser(null)
			}
		}

		fetchUser()
		return () => {
			mounted = false
		}
	}, [])

	return { user }
}

export default useUser
