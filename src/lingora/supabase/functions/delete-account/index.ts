import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  }

  const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) {
    return Response.json({ error: 'Sign in to delete your account.' }, { status: 401, headers });
  }

  try {
    const body = await request.json().catch(() => null);
    if (body?.confirmation !== 'DELETE') {
      return Response.json({ error: 'Deletion must be confirmed.' }, { status: 400, headers });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Your session could not be verified.' }, { status: 401, headers });
    }

    const args = { p_user_id: user.id };
    // Limit work per invocation. A retry starts from the remaining objects.
    for (let page = 0; page < 10; page++) {
      const { data, error } = await admin.rpc('account_deletion_objects', args);
      if (error) throw error;
      if (!data.length) {
        const deletion = await admin.rpc('erase_lingora_account', args);
        if (deletion.error) throw deletion.error;
        return Response.json({ deleted: true }, { headers });
      }

      const byBucket = new Map<string, string[]>();
      for (const { bucket_id, name } of data as { bucket_id: string; name: string }[]) {
        const paths = byBucket.get(bucket_id) ?? [];
        paths.push(name);
        byBucket.set(bucket_id, paths);
      }
      for (const [bucket, paths] of byBucket) {
        const { error: removalError } = await admin.storage.from(bucket).remove(paths);
        if (removalError) throw removalError;
      }
    }

    return Response.json({ error: 'More files remain. Please retry deletion.' }, { status: 503, headers });
  } catch (error) {
    console.error('Account deletion failed', error);
    return Response.json({ error: 'Deletion could not be completed. Please try again or contact support.' }, {
      status: 500, headers,
    });
  }
});
