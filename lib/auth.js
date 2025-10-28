import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
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
            image: user.profile.avatar
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB();
        
        if (account.provider === 'google') {
          const existingUser = await User.findOne({ 
            $or: [
              { email: user.email },
              { 'auth.googleId': account.providerAccountId }
            ]
          });
          
          if (!existingUser) {
            // Create new user for Google OAuth
            const newUser = new User({
              email: user.email,
              profile: {
                firstName: user.name.split(' ')[0],
                lastName: user.name.split(' ').slice(1).join(' '),
                avatar: user.image
              },
              auth: {
                googleId: account.providerAccountId,
                emailVerified: true
              }
            });
            
            await newUser.save();
          } else if (!existingUser.auth.googleId) {
            // Link Google account to existing user
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
      try {
        await connectDB();
        
        const user = await User.findOne({ email: session.user.email });
        
        if (user) {
          session.user.id = user._id.toString();
          session.user.referralCode = user.referralCode;
          session.user.referralEarnings = user.referralEarnings;
          session.user.referralCount = user.referralCount;
        }
        
        return session;
      } catch (error) {
        console.error('Session error:', error);
        return session;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
    signUp: '/signup'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Use environment variable if set, otherwise let NextAuth detect from request
  url: process.env.NEXTAUTH_URL,
  // Trust proxy to correctly detect the host in production
  trustHost: true,
  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production'
};

export { authOptions };
