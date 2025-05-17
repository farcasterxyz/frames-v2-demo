import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return Response.json(
      { message: "Missing authorization header" },
      { status: 401 }
    );
  }

  const url = new URL('https://auth.farcaster.xyz/verify-jwt')
  url.searchParams.set('token', authorization.split(' ')[1])
  url.searchParams.set('domain', (new URL(process.env.NEXT_PUBLIC_URL ?? '')).hostname)

  const res = await fetch(url.toString())

  if (res.status === 400) {
    return Response.json(
      { message: "Invalid token" },
      { status: 401 }
    );
  }

  if (res.status === 200) {
    const resBody = await res.json()
    return Response.json({ fid: Number(resBody.sub) });
  }

  throw new Error("Unknown error")
}
