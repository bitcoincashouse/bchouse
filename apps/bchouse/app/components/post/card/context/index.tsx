import React, { createContext, useContext } from 'react'
import { PostCardModel } from '~/components/post/types'

export const PostContext = createContext<PostCardModel | null>(null)
export const usePost = () => {
  const post = useContext(PostContext)
  if (!post) {
    throw new Error('this must be a child of a PostCard element')
  }

  return post
}

export const PostProvider = ({
  item,
  children,
}: {
  item: PostCardModel
  children: React.ReactNode
}) => {
  return <PostContext.Provider value={item}>{children}</PostContext.Provider>
}
