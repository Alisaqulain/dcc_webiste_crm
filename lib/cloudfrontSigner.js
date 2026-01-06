/**
 * CloudFront Signed URL Generator
 * 
 * Generates signed URLs for CloudFront video streaming
 * Requires: CloudFront key pair and private key
 */

import crypto from 'crypto';
import fs from 'fs';

/**
 * Generate CloudFront signed URL
 * 
 * @param {string} resource - CloudFront URL or path (e.g., https://d1234.cloudfront.net/video.mp4)
 * @param {string} keyPairId - CloudFront key pair ID
 * @param {string} privateKey - CloudFront private key (PEM format)
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
function generateSignedUrl(resource, keyPairId, privateKey, expiresIn = 3600) {
  // Parse the resource URL
  const url = new URL(resource);
  const path = url.pathname;
  const domain = url.hostname;

  // Calculate expiration time
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  // Create policy statement
  const policy = {
    Statement: [
      {
        Resource: resource,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': expiresAt
          }
        }
      }
    ]
  };

  // Convert policy to JSON and then to base64
  const policyJson = JSON.stringify(policy);
  const policyBase64 = Buffer.from(policyJson).toString('base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');

  // Sign the policy with private key
  const sign = crypto.createSign('RSA-SHA1');
  sign.update(policyJson);
  const signature = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');

  // Construct signed URL
  const signedUrl = `${resource}?Expires=${expiresAt}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;

  return signedUrl;
}

/**
 * Generate signed URL from video key
 * 
 * @param {string} videoKey - S3 video key/path
 * @param {string} cloudfrontDomain - CloudFront distribution domain
 * @param {string} keyPairId - CloudFront key pair ID
 * @param {string} privateKey - CloudFront private key
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {string} Signed URL
 */
function generateSignedUrlFromKey(videoKey, cloudfrontDomain, keyPairId, privateKey, expiresIn = 3600) {
  const resource = `https://${cloudfrontDomain}/${videoKey}`;
  return generateSignedUrl(resource, keyPairId, privateKey, expiresIn);
}

/**
 * Load private key from file or string
 * 
 * @param {string} keyPathOrContent - Path to private key file or key content
 * @returns {string} Private key content
 */
function loadPrivateKey(keyPathOrContent) {
  // Check if it's a file path
  if (fs.existsSync(keyPathOrContent)) {
    return fs.readFileSync(keyPathOrContent, 'utf8');
  }
  // Otherwise, treat as key content
  return keyPathOrContent;
}

export {
  generateSignedUrl,
  generateSignedUrlFromKey,
  loadPrivateKey
};

