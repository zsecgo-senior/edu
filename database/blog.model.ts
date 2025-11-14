import { Schema, model, models } from 'mongoose'

const BlogSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
		author: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		category: {
			name: {
				type: String,
				required: true,
			},
			slug: {
				type: String,
				required: true,
			},
		},
		tag: [
			{
				name: {
					type: String,
					required: true,
				},
				slug: {
					type: String,
					required: true,
				},
			},
		],
		slug: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true,
	}
)

const Blog = models.Blog || model('Blog', BlogSchema)
export default Blog
