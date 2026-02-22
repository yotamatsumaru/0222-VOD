import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY;

export function generateSignedUrl(
  resourceUrl: string,
  expiresIn: number = 3600
): string {
  if (!CLOUDFRONT_DOMAIN || !CLOUDFRONT_KEY_PAIR_ID || !CLOUDFRONT_PRIVATE_KEY) {
    console.warn('CloudFront credentials not configured, returning original URL');
    return resourceUrl;
  }

  try {
    const dateLessThan = new Date(Date.now() + expiresIn * 1000).toISOString();

    const signedUrl = getSignedUrl({
      url: resourceUrl,
      keyPairId: CLOUDFRONT_KEY_PAIR_ID,
      dateLessThan,
      privateKey: CLOUDFRONT_PRIVATE_KEY,
    });

    return signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return resourceUrl;
  }
}

export interface SignedCookies {
  'CloudFront-Policy': string;
  'CloudFront-Signature': string;
  'CloudFront-Key-Pair-Id': string;
}

export function generateSignedCookies(
  resourcePath: string,
  expiresIn: number = 3600
): SignedCookies | null {
  if (!CLOUDFRONT_DOMAIN || !CLOUDFRONT_KEY_PAIR_ID || !CLOUDFRONT_PRIVATE_KEY) {
    console.warn('CloudFront credentials not configured');
    return null;
  }

  try {
    const policy = JSON.stringify({
      Statement: [
        {
          Resource: `https://${CLOUDFRONT_DOMAIN}${resourcePath}`,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor(Date.now() / 1000) + expiresIn,
            },
          },
        },
      ],
    });

    const policyBase64 = Buffer.from(policy).toString('base64');
    
    // Note: Full implementation would require crypto signing
    // This is a simplified version
    return {
      'CloudFront-Policy': policyBase64,
      'CloudFront-Signature': 'signature-placeholder',
      'CloudFront-Key-Pair-Id': CLOUDFRONT_KEY_PAIR_ID,
    };
  } catch (error) {
    console.error('Failed to generate signed cookies:', error);
    return null;
  }
}
