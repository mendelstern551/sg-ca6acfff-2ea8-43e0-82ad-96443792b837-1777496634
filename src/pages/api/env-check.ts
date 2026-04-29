import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Simple endpoint to check if environment variables are loaded
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30),
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30),
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  };

  return res.status(200).json(envCheck);
}