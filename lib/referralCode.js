/**
 * Referral codes: PREFIX (from first name) + 4 random digits, e.g. ALI4821
 */

export function slugPrefix(firstName) {
  const s = String(firstName || 'USER')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  return s || 'USER';
}

export async function generateUniqueReferralCode(UserModel, firstName) {
  const prefix = slugPrefix(firstName);
  for (let i = 0; i < 50; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}${suffix}`;
    const exists = await UserModel.exists({ referralCode: code });
    if (!exists) return code;
  }
  const fallback = `${prefix}${Date.now().toString().slice(-4)}`;
  if (!(await UserModel.exists({ referralCode: fallback }))) return fallback;
  return `${prefix}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
