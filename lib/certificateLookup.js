import Certificate from '@/models/Certificate';

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find certificate by roll number with flexible matching:
 * exact → case-insensitive → ends-with / partial suffix (e.g. DCC20 → 00781/DCC20)
 */
export async function findCertificateByRollNumber(rawRoll) {
  const roll = String(rawRoll || '').trim();
  if (!roll) return null;

  let certificate = await Certificate.findOne({ rollNumber: roll });
  if (certificate) return certificate;

  const exactCi = new RegExp(`^${escapeRegex(roll)}$`, 'i');
  certificate = await Certificate.findOne({ rollNumber: exactCi });
  if (certificate) return certificate;

  const suffixPatterns = [
    new RegExp(`${escapeRegex(roll)}$`, 'i'),
    new RegExp(`/${escapeRegex(roll)}$`, 'i'),
  ];

  const matches = await Certificate.find({
    $or: suffixPatterns.map((r) => ({ rollNumber: r })),
  })
    .limit(5)
    .lean();

  if (matches.length === 1) {
    return await Certificate.findById(matches[0]._id);
  }

  if (matches.length > 1) {
    const exactSuffix = matches.find(
      (c) => c.rollNumber.toLowerCase() === roll.toLowerCase()
    );
    if (exactSuffix) return await Certificate.findById(exactSuffix._id);

    const slashSuffix = matches.find((c) =>
      c.rollNumber.toLowerCase().endsWith(`/${roll.toLowerCase()}`)
    );
    if (slashSuffix) return await Certificate.findById(slashSuffix._id);

    return await Certificate.findById(matches[0]._id);
  }

  return null;
}
