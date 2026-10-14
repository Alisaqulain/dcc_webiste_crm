'use client';

/**
 * Certificate drawn in code to match the Digital Career Center template.
 * Student photo, name, course, dates, and roll number are filled in from CRM data.
 */

function formatCertificateDate(date) {
  if (!date) return '';
  const text = String(date);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return `${dateOnly[2]}/${dateOnly[3]}/${dateOnly[1]}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
}

export function resolvePhotoSrc(photo) {
  if (!photo) return '';
  if (photo.startsWith('http') || photo.startsWith('data:') || photo.startsWith('blob:')) return photo;
  return photo.startsWith('/') ? photo : `/${photo}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const fieldStyle = {
  position: 'absolute',
  zIndex: 4,
  fontFamily: '"Times New Roman", Times, serif',
  fontWeight: 700,
  color: '#111',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export default function CertificatePreview({ certificate, className = '', sheetId = 'certificate-sheet' }) {
  const photoSrc = resolvePhotoSrc(certificate?.photo);
  const photoZoom = Math.min(2.5, Math.max(1, Number(certificate?.photoZoom) || 1));
  const photoOffsetX = Math.min(40, Math.max(-40, Number(certificate?.photoOffsetX) || 0));
  const photoOffsetY = Math.min(40, Math.max(-40, Number(certificate?.photoOffsetY) || 0));
  const studentName = certificate?.studentName || '';
  const parentName = certificate?.parentName || '';
  const courseName = certificate?.courseName || '';
  const duration = certificate?.duration ? String(certificate.duration) : '';
  const startDate = formatCertificateDate(certificate?.startDate);
  const endDate = formatCertificateDate(certificate?.endDate);
  const rollNumber = certificate?.rollNumber || '';

  return (
    <div
      id={sheetId}
      className={className}
      style={{
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        containerType: 'inline-size',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1280 / 904',
          background: '#fff',
          overflow: 'hidden',
          color: '#111',
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        <img
          src="/certificate-base.jpg?v=9"
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }}
        />

        {rollNumber ? (
          <div style={{ ...fieldStyle, top: '27.05%', left: '52.4%', fontSize: '1.9cqw' }}>
            {rollNumber}
          </div>
        ) : null}

        <div
          style={{
            ...fieldStyle,
            top: '44%',
            left: '14%',
            width: '72%',
            textAlign: 'center',
            fontSize: '2.2cqw',
            lineHeight: 1.52,
            whiteSpace: 'normal',
            background: 'transparent',
          }}
        >
          <div>
            This is certify that Mr./Ms.{' '}
            <span style={{ borderBottom: '0.12cqw solid #111', padding: '0 0.35cqw' }}>{studentName || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'}</span>
          </div>
          <div>
            S/o, D/o, .{' '}
            <span style={{ borderBottom: '0.12cqw solid #111', padding: '0 0.35cqw' }}>{parentName || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'}</span>
            {' '}has been
          </div>
          <div>
            Award certificate in :{' '}
            <span style={{ borderBottom: '0.12cqw solid #111', padding: '0 0.35cqw' }}>{courseName || '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'}</span>
          </div>
          <div>
            He/She has successfully completed :{' '}
            <span style={{ borderBottom: '0.12cqw solid #111', padding: '0 0.35cqw' }}>{duration || '\u00a0\u00a0'}</span>
            / Days
          </div>
          <div>
            with effect from{' '}
            <span style={{ borderBottom: '0.12cqw solid #111', padding: '0 0.35cqw' }}>{startDate || '\u00a0\u00a0\u00a0\u00a0'}</span>
            {' '}to{' '}
            <span style={{ borderBottom: '0.12cqw solid #111', padding: '0 0.35cqw' }}>{endDate || '\u00a0\u00a0\u00a0\u00a0'}</span>
            {' '}by
          </div>
          <div>Digital Career Center with Grade: "A+"</div>
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            zIndex: 4,
            top: '81.55%',
            left: '15.5%',
            width: '48.8%',
            height: '0.16cqw',
            background: '#222',
          }}
        />

        <div
          style={{
            position: 'absolute',
            zIndex: 4,
            left: '80.7%',
            top: '23.9%',
            width: '13.5%',
            aspectRatio: '1',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#fff',
            border: '0.14cqw solid #1a1a1a',
            boxSizing: 'border-box',
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Student photo"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: `translate(${photoOffsetX}%, ${photoOffsetY}%) scale(${photoZoom})`,
                transformOrigin: 'center center',
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
export function printCertificateElement(element, title = 'Certificate') {
  if (!element || typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const clone = element.cloneNode(true);
  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('/')) {
      img.setAttribute('src', `${window.location.origin}${src}`);
    }
  });

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: landscape; margin: 8mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body { display: flex; justify-content: center; align-items: flex-start; }
      #${element.id || 'certificate-sheet'} { width: 1100px; max-width: 100%; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
  </head>
  <body>
    ${clone.outerHTML}
    <script>
      window.onload = function () {
        setTimeout(function () { window.print(); }, 400);
      };
    </script>
  </body>
</html>`);
  printWindow.document.close();
}
