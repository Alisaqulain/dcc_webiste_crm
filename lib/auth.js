import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { headers } from 'next/headers';
import connectDB from './mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateUniqueReferralCode } from './referralCode';

function getSignupRefFromCookieHeader() {
  try {
    const h = headers();
    const raw = h.get('cookie') || '';
    const m = raw.match(/(?:^|;\s*)signup_ref=([^;]*)/);
    if (!m) return null;
    const v = decodeURIComponent(m[1].trim());
    return v || null;
  } catch {
    return null;
  }
}

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
          });

          if (!user || !user.auth?.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.auth.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            image: user.profile.avatar,
            isActive: user.isActive !== false,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB();

        if (account.provider === 'google') {
          const existingUser = await User.findOne({
            $or: [
              { email: user.email?.toLowerCase() },
              { 'auth.googleId': account.providerAccountId },
            ],
          });

          if (!existingUser) {
            const refRaw = getSignupRefFromCookieHeader();
            let referredBy = null;
            if (refRaw) {
              const upper = refRaw.toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (upper) {
                const referrer = await User.findOne({ referralCode: upper });
                if (referrer && referrer.email !== user.email?.toLowerCase()) {
                  referredBy = referrer._id;
                }
              }
            }

            const first =
              profile?.given_name || user.name?.split(' ')[0] || 'User';
            const last =
              profile?.family_name ||
              user.name?.split(' ').slice(1).join(' ') ||
              '';
            const referralCode = await generateUniqueReferralCode(User, first);

            const newUser = new User({
              email: user.email.toLowerCase(),
              profile: {
                firstName: first,
                lastName: last,
                avatar: user.image,
              },
              auth: {
                googleId: account.providerAccountId,
                emailVerified: true,
              },
              referredBy,
              referralLocked: true,
              isActive: false,
              referralCode,
            });

            await newUser.save();
          } else if (!existingUser.auth.googleId) {
            existingUser.auth.googleId = account.providerAccountId;
            existingUser.auth.emailVerified = true;
            if (user.image) {
              existingUser.profile.avatar = user.image;
            }
            await existingUser.save();
          }
        }

        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      }
      session.user.isActive = token?.isActive !== false;
      session.user.referralCode = token.referralCode;
      session.user.referralEarnings = token.referralEarnings;
      session.user.referralCount = token.referralCount;
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session && typeof session.isActive === 'boolean') {
        token.isActive = session.isActive;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.email = user.email;
        if (typeof user.isActive === 'boolean') {
          token.isActive = user.isActive;
        }
      }

      const email = (user?.email || token.email)
        ? String(user?.email || token.email).toLowerCase()
        : null;
      if (email && user) {
        await connectDB();
        const dbUser = await User.findOne({ email }).select(
          '_id isActive referralCode referralEarnings referralCount'
        );
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.isActive = dbUser.isActive !== false;
          token.referralCode = dbUser.referralCode;
          token.referralEarnings = dbUser.referralEarnings ?? 0;
          token.referralCount = dbUser.referralCount ?? 0;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
};

export { authOptions };
