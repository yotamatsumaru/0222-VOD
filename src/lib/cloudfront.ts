/**
 * Generate CloudFront signed URL
 * This requires CLOUDFRONT_PRIVATE_KEY and CLOUDFRONT_KEY_PAIR_ID environment variables
 * 
 * Note: This is a simplified implementation for demonstration.
 * For production, you should use a proper CloudFront signing library or AWS SDK.
 */

export async function generateSignedUrl(
  url: string,
  keyPairId: string,
  privateKeyPem: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const expireTime = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  // Create policy statement
  const policy = {
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': expireTime,
          },
        },
      },
    ],
  };

  const policyString = JSON.stringify(policy);
  const policyBase64 = btoa(policyString)
    .replace(/\+/g, '-')
    .replace(/\=/g, '_')
    .replace(/\//g, '~');

  // For production, you need to properly sign with RSA-SHA1
  // This is a placeholder - actual implementation requires crypto signing
  const signature = await signPolicy(policyString, privateKeyPem);
  const signatureBase64 = signature
    .replace(/\+/g, '-')
    .replace(/\=/g, '_')
    .replace(/\//g, '~');

  // Construct signed URL
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}Policy=${policyBase64}&Signature=${signatureBase64}&Key-Pair-Id=${keyPairId}`;
}

async function signPolicy(policy: string, privateKeyPem: string): Promise<string> {
  // This is a simplified placeholder
  // In production, you should use proper RSA-SHA1 signing with the private key
  // You may need to use Web Crypto API or import a signing library
  
  // For now, return a base64 encoded hash as placeholder
  const encoder = new TextEncoder();
  const data = encoder.encode(policy);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  return hashBase64;
}

/**
 * Alternative: Generate signed cookies for CloudFront
 * This allows access to multiple resources without signing each URL
 */
export async function generateSignedCookies(
  resourcePath: string,
  keyPairId: string,
  privateKeyPem: string,
  expiresInSeconds: number = 3600
): Promise<{
  'CloudFront-Policy': string;
  'CloudFront-Signature': string;
  'CloudFront-Key-Pair-Id': string;
}> {
  const expireTime = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  const policy = {
    Statement: [
      {
        Resource: resourcePath,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': expireTime,
          },
        },
      },
    ],
  };

  const policyString = JSON.stringify(policy);
  const policyBase64 = btoa(policyString)
    .replace(/\+/g, '-')
    .replace(/\=/g, '_')
    .replace(/\//g, '~');

  const signature = await signPolicy(policyString, privateKeyPem);
  const signatureBase64 = signature
    .replace(/\+/g, '-')
    .replace(/\=/g, '_')
    .replace(/\//g, '~');

  return {
    'CloudFront-Policy': policyBase64,
    'CloudFront-Signature': signatureBase64,
    'CloudFront-Key-Pair-Id': keyPairId,
  };
}
