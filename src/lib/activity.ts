import 'server-only'
import { createClient } from '@/lib/supabase/server'

/** Append an audit entry. actor_id is forced to the current user (RLS). */
export async function logActivity(input: {
  action: string
  entityType?: string
  entityId?: string | null
  description?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('activity_logs').insert({
    actor_id: user.id,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    description: input.description ?? null,
    metadata: input.metadata ?? {},
  })
}

/** Create in-app notifications for one or more users. */
export async function notify(
  userIds: (string | null | undefined)[],
  n: { title: string; message?: string; type?: string; link?: string }
) {
  const ids = [...new Set(userIds.filter(Boolean) as string[])]
  if (ids.length === 0) return
  const supabase = await createClient()
  await supabase.from('notifications').insert(
    ids.map((uid) => ({
      user_id: uid,
      title: n.title,
      message: n.message ?? null,
      type: n.type ?? 'info',
      link: n.link ?? null,
    }))
  )
}

/**
 * Notify every user with one of the given roles via a SECURITY DEFINER RPC.
 * Works even when the caller (e.g. a vendor) cannot read staff profiles.
 */
export async function notifyRoles(
  roles: ('admin' | 'procurement_officer' | 'manager' | 'vendor')[],
  n: { title: string; message?: string; type?: string; link?: string }
) {
  const supabase = await createClient()
  await supabase.rpc('notify_roles', {
    p_roles: roles,
    p_title: n.title,
    p_message: n.message ?? null,
    p_type: n.type ?? 'info',
    p_link: n.link ?? null,
  })
}
