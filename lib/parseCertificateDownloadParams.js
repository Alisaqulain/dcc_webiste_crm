/**
 * Parse /certificate/download/* URL segments into document type + roll number.
 * Supports:
 *   /certificate/download/ROLL123
 *   /certificate/download/Dt/1
 *   /certificate/download/certificate/ROLL123  (legacy [type]/[rollNumber] URLs)
 *   /certificate/download/idcard/ROLL123
 */
export function parseCertificateDownloadParams(paramsArray) {
  const segments = Array.isArray(paramsArray)
    ? paramsArray.map((s) => String(s || '').trim()).filter(Boolean)
    : paramsArray
      ? [String(paramsArray).trim()].filter(Boolean)
      : [];

  if (
    segments.length >= 2 &&
    (segments[0] === 'certificate' || segments[0] === 'idcard')
  ) {
    return {
      documentType: segments[0],
      rollNumber: segments.slice(1).join('/'),
    };
  }

  return {
    documentType: 'certificate',
    rollNumber: segments.join('/'),
  };
}
