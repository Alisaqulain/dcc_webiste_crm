'use client';

/**
 * Certificate preview with overlays aligned to the background image.
 * Uses a natural-aspect img (not object-contain in a fixed box) so % positions
 * stay correct on mobile and desktop.
 */

function formatDate(date) {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function formatDateDDMMYYYY(date) {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return 'N/A';
  }
}

function resolvePhotoSrc(photo) {
  if (!photo) return '';
  if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
  return photo.startsWith('/') ? photo : `/${photo}`;
}

const FIELDS = [
  { key: 'rollNumber', top: '27%', left: '55.5%', size: '1.85cqw', fallback: 'N/A' },
  { key: 'studentName', top: '45%', left: '60%', size: '2.2cqw', fallback: 'N/A' },
  { key: 'parentName', top: '50%', left: '47%', size: '1.85cqw', fallback: 'N/A' },
  {
    key: 'courseName',
    top: '53.5%',
    left: '50%',
    size: '1.75cqw',
    fallback: 'N/A',
    maxWidth: '38%',
    wrap: true,
  },
  { key: 'duration', top: '58%', left: '65%', size: '1.85cqw', fallback: '0' },
  {
    key: 'startDate',
    top: '62%',
    left: '45%',
    size: '1.55cqw',
    format: formatDate,
  },
  {
    key: 'endDate',
    top: '62%',
    left: '65%',
    size: '1.55cqw',
    format: formatDateDDMMYYYY,
  },
];

export default function CertificatePreview({ certificate, className = '' }) {
  const photoSrc = resolvePhotoSrc(certificate?.photo);

  const getValue = (field) => {
    const raw = certificate?.[field.key];
    if (field.format) return field.format(raw);
    return raw ?? field.fallback ?? '';
  };

  return (
    <div
      className={`relative w-full max-w-[1000px] mx-auto ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      <img
        src="/certificate1.jpg"
        alt="Digital Career Center Certificate"
        className="w-full h-auto block rounded-lg shadow-lg select-none"
        draggable={false}
      />

      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {photoSrc ? (
          <img
            src={photoSrc}
            alt=""
            className="absolute z-10 rounded object-cover border-2 border-gray-300 bg-gray-100"
            style={{
              top: '25%',
              left: '80%',
              width: '13%',
              height: 'auto',
              aspectRatio: '1.08',
              maxHeight: '22%',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}

        {FIELDS.map((field) => (
          <span
            key={field.key}
            className="absolute z-10 font-bold text-black leading-tight"
            style={{
              top: field.top,
              left: field.left,
              fontSize: field.size,
              maxWidth: field.maxWidth,
              whiteSpace: field.wrap ? 'normal' : 'nowrap',
              wordBreak: field.wrap ? 'break-word' : undefined,
            }}
          >
            {getValue(field)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Print HTML overlay positions (800px design width) */
export function buildCertificatePrintHtml(certificate) {
  const studentName = certificate.studentName || 'N/A';
  const parentName = certificate.parentName || 'N/A';
  const courseName = certificate.courseName || 'N/A';
  const duration = certificate.duration || 0;
  const startDate = formatDate(certificate.startDate);
  const endDate = formatDateDDMMYYYY(certificate.endDate);
  const rollNum = certificate.rollNumber || 'N/A';
  const photoUrl = resolvePhotoSrc(certificate.photo);

  return { studentName, parentName, courseName, duration, startDate, endDate, rollNum, photoUrl };
}
