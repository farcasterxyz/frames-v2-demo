import { ed25519 } from "@noble/curves/ed25519";
import { eventHeaderSchema, eventSchema } from "@farcaster/frame-sdk";
import { isSignerValid } from "~/lib/neynar";

type VerifyJsonFarcasterSignatureResult =
  | { success: false; error: unknown }
  | { success: true; fid: number; payload: string };

export async function verifyJsonFarcasterSignature(
  data: unknown
): Promise<VerifyJsonFarcasterSignatureResult> {
  // Parse & decode
  const body = eventSchema.safeParse(data);
  if (body.success === false) {
    return { success: false, error: body.error.errors };
  }

  const headerData = JSON.parse(
    Buffer.from(body.data.header, "base64url").toString("utf-8")
  );
  const header = eventHeaderSchema.safeParse(headerData);
  if (header.success === false) {
    return { success: false, error: header.error.errors };
  }

  const fid = header.data.fid;
  const key = header.data.key;

  // Verify that the signer belongs to the FID
  try {
    const validSigner = await isSignerValid({
      fid,
      signerPublicKey: key,
    });
    if (!validSigner) {
      return { success: false, error: "Invalid signer" };
    }
  } catch {
    return { success: false, error: "Error verifying signer" };
  }

  // Verify that the payload was signed by the signer
  const signature = Buffer.from(body.data.signature, "base64url");
  if (signature.byteLength !== 64) {
    return { success: false, error: "Invalid signature length" };
  }

  const signedInput = new Uint8Array(
    Buffer.from(body.data.header + "." + body.data.payload)
  );

  const keyBytes = Uint8Array.from(Buffer.from(key.slice(2), "hex"));

  const verifyResult = ed25519.verify(signature, signedInput, keyBytes);
  if (!verifyResult) {
    return { success: false, error: "Invalid signature" };
  }

  return { success: true, fid, payload: body.data.payload };
}
