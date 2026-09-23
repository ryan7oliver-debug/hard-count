import { getUser } from '@netlify/identity';

export default async () => {
  const user = await getUser();
  return new Response(JSON.stringify({ user: user ? { id: user.id, email: user.email } : null }), {
    headers: { 'content-type': 'application/json' },
  });
};
export const config = { path: '/api/auth-user' };
