import { asc, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { classPostComments, classPosts, users } from '@/db/schema';
import type { ClassPost } from '@/lib/types';

export const MAX_POST_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 1000;
const POST_LIMIT = 30;

const authorCols = {
  id: users.id,
  name: users.name,
  avatarOptions: users.avatarOptions,
  equippedItemId: users.equippedItemId,
};

/** A group's announcements (pinned first, then newest) with their comments.
 * `canManage` = the viewer is a group admin (may delete anything). */
export async function loadPosts(classId: string, viewerId: string, canManage: boolean): Promise<ClassPost[]> {
  const db = getDb();
  const posts = await db
    .select({ post: classPosts, author: authorCols })
    .from(classPosts)
    .innerJoin(users, eq(classPosts.authorId, users.id))
    .where(eq(classPosts.classId, classId))
    .orderBy(desc(classPosts.pinned), desc(classPosts.createdAt))
    .limit(POST_LIMIT);
  if (posts.length === 0) return [];

  const comments = await db
    .select({ comment: classPostComments, author: authorCols })
    .from(classPostComments)
    .innerJoin(users, eq(classPostComments.authorId, users.id))
    .where(inArray(classPostComments.postId, posts.map((p) => p.post.id)))
    .orderBy(asc(classPostComments.createdAt));

  return posts.map(({ post, author }) => ({
    id: post.id,
    body: post.body,
    pinned: post.pinned,
    createdAt: post.createdAt.toISOString(),
    author,
    canDelete: canManage || post.authorId === viewerId,
    comments: comments
      .filter((c) => c.comment.postId === post.id)
      .map(({ comment, author: a }) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: a,
        canDelete: canManage || comment.authorId === viewerId,
      })),
  }));
}
