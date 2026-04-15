import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

type PostRow = {
  id: number;
  profile_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

type ProfileLite = {
  id: string;
  nome: string | null;
  username: string | null;
  avatar_url: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { userId } = auth;

  const limitParam = Number(req.nextUrl.searchParams.get("limit") || "20");
  const limit = Number.isFinite(limitParam)
    ? Math.max(5, Math.min(40, Math.trunc(limitParam)))
    : 20;

  const { data: postsData, error: postsError } = await supabaseAdmin
    .from("social_posts")
    .select("id, profile_id, content, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const posts = (postsData || []) as PostRow[];
  const profileIds = Array.from(new Set(posts.map((item) => item.profile_id)));
  const postIds = posts.map((item) => item.id);

  const profileMap = new Map<string, ProfileLite>();
  if (profileIds.length > 0) {
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, username, avatar_url")
      .in("id", profileIds);

    (profileData || []).forEach((item) => {
      profileMap.set(String(item.id), {
        id: String(item.id),
        nome: item.nome || null,
        username: item.username || null,
        avatar_url: item.avatar_url || null,
      });
    });
  }

  const likeCountMap = new Map<number, number>();
  const likedByMe = new Set<number>();
  if (postIds.length > 0) {
    const { data: likesData } = await supabaseAdmin
      .from("social_post_likes")
      .select("post_id, profile_id")
      .in("post_id", postIds);

    (likesData || []).forEach((item) => {
      const postId = Number(item.post_id);
      likeCountMap.set(postId, (likeCountMap.get(postId) || 0) + 1);
      if (String(item.profile_id) === userId) {
        likedByMe.add(postId);
      }
    });
  }

  const commentCountMap = new Map<number, number>();
  const commentsByPost = new Map<number, Array<Record<string, unknown>>>();
  if (postIds.length > 0) {
    const { data: commentsData } = await supabaseAdmin
      .from("social_post_comments")
      .select("id, post_id, profile_id, content, created_at")
      .in("post_id", postIds)
      .order("created_at", { ascending: false });

    (commentsData || []).forEach((item) => {
      const postId = Number(item.post_id);
      commentCountMap.set(postId, (commentCountMap.get(postId) || 0) + 1);
      if (!commentsByPost.has(postId)) commentsByPost.set(postId, []);
      const arr = commentsByPost.get(postId)!;
      if (arr.length < 3) {
        const author = profileMap.get(String(item.profile_id));
        arr.push({
          id: item.id,
          content: item.content,
          created_at: item.created_at,
          author: author || {
            id: String(item.profile_id),
            nome: "Membro",
            username: null,
            avatar_url: null,
          },
        });
      }
    });
  }

  return NextResponse.json({
    posts: posts.map((post) => ({
      ...post,
      author: profileMap.get(post.profile_id) || {
        id: post.profile_id,
        nome: "Membro",
        username: null,
        avatar_url: null,
      },
      like_count: likeCountMap.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0,
      liked_by_me: likedByMe.has(post.id),
      recent_comments: commentsByPost.get(post.id) || [],
    })),
  });
}
