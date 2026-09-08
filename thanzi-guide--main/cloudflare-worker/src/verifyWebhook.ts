// Appwrite signs each webhook request with:
//   base64( HMAC-SHA1( webhookUrl + rawBody, signingSecret ) )
// sent in the `x-appwrite-webhook-signature` header. Verifying this proves
// the request actually came from your Appwrite project and not someone who
// guessed the Worker's URL.
// Docs: https://appwrite.io/docs/advanced/platform/webhooks

function toBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyAppwriteWebhook(
  requestUrl: string,
  rawBody: string,
  signatureHeader: string | null,
  signingSecret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(requestUrl + rawBody));
  const expected = toBase64(signature);

  return timingSafeEqual(expected, signatureHeader);
}
