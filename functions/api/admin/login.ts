import { AdminAuthError, verifyAdminPassword } from "../../_lib/admin";

type Env = { adminKey?: string };

type LoginBody = {
  password?: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const password = body?.password ?? null;
    verifyAdminPassword(password, env);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return new Response(error.message, { status: error.status });
    }
    console.error(error);
    return new Response('Login failed', { status: 500 });
  }
};
