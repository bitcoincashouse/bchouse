import { moment } from '@bchouse/utils'
import { Doc } from '@bchouse/utils/src/tiptapSchema'
import { Client } from 'typesense'
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'
import { z } from 'zod'
import postRepo from '../repositories/posts'
import { getAllHashtags } from '../repositories/posts/getAllHashtags'
import userRepo from '../repositories/user'

export const typesenseClient = new Client({
  nodes: [
    {
      url: (process.env.TYPESENSE_URL as string) || 'http://localhost:8108',
    },
  ],
  apiKey: (process.env.TYPESENSE_API_KEY as string) || 'xyz',
  connectionTimeoutSeconds: 2,
})

async function reindexTypesenseCollection<T extends Record<string, any>[]>(
  name: string,
  schema: Omit<CollectionCreateSchema, 'name'>,
  documents: T
) {
  return await typesenseClient
    .collections(name)
    .delete()
    .catch(() => {})
    .then(() =>
      typesenseClient.collections().create({
        name: name,
        ...schema,
      })
    )
    .then(() =>
      documents.length
        ? typesenseClient
            .collections(name)
            .documents()
            .import(documents, { action: 'create' })
        : null
    )
}

export class SearchService {
  async upsertUser(
    user: {
      id: string
    } & Partial<{
      user_username: string
      user_fullname: string
      user_avatarUrl: string
      user_createdAt: Date
    }>
  ) {
    await typesenseClient
      .collections('users')
      .documents()
      .upsert(
        z
          .object({
            id: z.string().optional(),
            user_username: z.string().optional(),
            user_fullname: z.string().optional(),
            user_avatarUrl: z.string().optional(),
            user_createdAt: z
              .date()
              .optional()
              .transform((val) => val && moment(val).unix()),
          })
          .strip()
          .parse(user)
      )
  }

  async reindex() {
    //Fetch all public users, organizations, posts and pass to Typesense
    return await Promise.all([
      getAllHashtags().then((hashtags) => {
        const importHashtags = hashtags.map((hashtag) => ({
          hashtag: hashtag.hashtag,
          postCount: Number(hashtag.postCount),
        }))
        return reindexTypesenseCollection(
          'hashtags',
          {
            fields: [
              { name: 'hashtag', type: 'string', facet: true },
              { name: 'postCount', type: 'int32', facet: true },
            ],
            default_sorting_field: 'postCount',
          },
          importHashtags
        )
      }),
      postRepo.getAllPosts().then((posts) => {
        const importPosts = posts.map((post) => ({
          id: post.id,
          //TODO: Get text (remove marks) and serialize mentions/hashtags
          post_content: JSON.stringify(post.content),
          post_author_id: post.publishedById,
          post_createdAt: moment(post.createdAt).unix(),
          hashtags: post.hashtags.map((h) => h.hashtag),
        }))
        return reindexTypesenseCollection(
          'posts',
          {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'post_content', type: 'string', facet: true },
              { name: 'post_author_id', type: 'string', facet: true },
              { name: 'post_createdAt', type: 'int32', facet: true },
              { name: 'hashtags', type: 'string[]', facet: true },
            ],
            default_sorting_field: 'post_createdAt',
          },
          importPosts
        )
      }),
      userRepo.getAllUsers().then((users) => {
        const importUsers = users.map((user) => {
          return {
            id: user.id,
            user_username: user.username,
            user_fullname: [user.firstName || '', user.lastName || '']
              .filter(Boolean)
              .join(' ')
              .trim(),
            user_avatarUrl: user.avatarUrl || '',
            user_createdAt: moment(user.createdAt).unix(),
          }
        })

        return reindexTypesenseCollection(
          'users',
          {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'user_username', type: 'string', facet: true },
              { name: 'user_fullname', type: 'string', facet: true },
              { name: 'user_avatarUrl', type: 'string' },
              { name: 'user_createdAt', type: 'int32', facet: true },
            ],
            enable_nested_fields: true,
            default_sorting_field: 'user_createdAt',
          },
          importUsers
        )
      }),
    ])
  }

  async searchPosts(q: string) {
    return typesenseClient
      .collections<{
        id: string
        post_author_id: string
      }>('posts')
      .documents()
      .search({
        q,
        preset: 'match_all_attributes',
        query_by: 'post_content,hashtags,post_author_id',
        sort_by: '_text_match:desc',
      })
  }

  async addPost(post: {
    id: string
    content: Doc
    publishedById: string
    createdAt: Date
    hashtags: { tag: string }[]
  }) {
    await typesenseClient
      .collections('posts')
      .documents()
      .create({
        id: post.id,
        //TODO: Get text (remove marks) and serialize mentions/hashtags
        post_content: JSON.stringify(post.content),
        post_author_id: post.publishedById,
        post_createdAt: moment(post.createdAt).unix(),
        hashtags: post.hashtags.map((h) => h.tag),
      })

    if (post.hashtags.length) {
      await typesenseClient
        .collections('hashtags')
        .documents()
        .import(
          post.hashtags.map((h) => ({
            hashtag: h.tag,
            postCount: 0,
          })),
          { action: 'upsert' }
        )
    }
  }

  async removePost(postId: string) {
    return typesenseClient.collections('posts').documents().delete(postId)
  }
}
