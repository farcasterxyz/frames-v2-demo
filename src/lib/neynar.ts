const apiKey = process.env.NEYNAR_API_KEY || "";

export async function isSignerValid({
  fid,
  signerPublicKey,
}: {
  fid: number;
  signerPublicKey: string;
}): Promise<boolean> {
  const url = new URL("https://hub-api.neynar.com/v1/onChainSignersByFid");
  url.searchParams.append("fid", fid.toString());

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (response.status !== 200) {
    throw new Error(await response.text());
  }

  const responseJson = await response.json();
  const signerPublicKeyLC = signerPublicKey.toLowerCase();

  const signerExists = responseJson.events.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) =>
      event.signerEventBody.key.toLowerCase() === signerPublicKeyLC
  );

  return signerExists;
}
