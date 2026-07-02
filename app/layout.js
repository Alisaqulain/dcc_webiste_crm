import "./globals.css";
import { Poppins } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SessionProvider from "./components/SessionProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.digitalcareercenter.com';

// Configure Poppins font with multiple weights
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Digital Career Center - Transform Your Career with Expert-Led Courses",
    template: "%s | Digital Career Center"
  },
  description: "Master essential digital skills and advance your professional journey with our comprehensive course bundles. Learn from industry professionals and get certified. Digital marketing, SEO, web development courses in Muzaffarnagar.",
  keywords: [
    "digital marketing course",
    "SEO training",
    "web development course",
    "digital career center",
    "computer course Muzaffarnagar",
    "digital skills training",
    "online courses India",
    "career development",
    "professional certification",
    "digital marketing institute"
  ],
  authors: [{ name: "Digital Career Center" }],
  creator: "Digital Career Center",
  publisher: "Digital Career Center",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: '/newlogo.jpeg', type: 'image/jpeg' }],
    apple: '/newlogo.jpeg',
    shortcut: '/newlogo.jpeg',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Digital Career Center - Transform Your Career with Expert-Led Courses",
    description: "Master essential digital skills and advance your professional journey with our comprehensive course bundles. Learn from industry professionals and get certified.",
    url: siteUrl,
    siteName: 'Digital Career Center',
    images: [
      {
        url: '/newlogo.jpeg',
        width: 512,
        height: 512,
        alt: 'Digital Career Center Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Digital Career Center - Transform Your Career with Expert-Led Courses",
    description: "Master essential digital skills and advance your professional journey with our comprehensive course bundles. Learn from industry professionals and get certified.",
    images: ['/newlogo.jpeg'],
    creator: '@digitalcareercenter',
    site: '@digitalcareercenter',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/newlogo.jpeg" sizes="any" />
        <link rel="icon" href="/newlogo.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/newlogo.jpeg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* JSON-LD Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "Digital Career Center",
              "alternateName": "DCC",
              "url": siteUrl,
              "logo": `${siteUrl}/newlogo.jpeg`,
              "description": "Digital Career Center is a leading institute in Muzaffarnagar, dedicated to empowering students and professionals with practical digital skills. Since 2018, we have helped transform careers with hands-on training in digital marketing, computer courses, and web development.",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "1st Floor, Raja Ji Market, Near M.B Public School, Mimlana Road",
                "addressLocality": "Muzaffarnagar",
                "addressRegion": "Uttar Pradesh",
                "postalCode": "251002",
                "addressCountry": "IN"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "telephone": "+91-7599863007",
                  "contactType": "customer service",
                  "areaServed": "IN",
                  "availableLanguage": ["English", "Hindi"]
                },
                {
                  "@type": "ContactPoint",
                  "telephone": "+91-8218971413",
                  "contactType": "customer service",
                  "areaServed": "IN",
                  "availableLanguage": ["English", "Hindi"]
                }
              ],
              "email": "info@digitalcareercenter.com",
              "foundingDate": "2018",
              "sameAs": [
                "https://www.facebook.com/people/Digital-Career-Center/61565596980338/",
                "https://www.instagram.com/digitalcareercenterofficial",
                "https://www.youtube.com/@DigitalCareercenter",
                "https://www.linkedin.com/company/digital-career-center",
                "https://t.me/digitalcareercentermzn"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Digital Skills Courses",
                "itemListElement": [
                  {
                    "@type": "Course",
                    "name": "Digital Starter Package (DSP)",
                    "description": "4 comprehensive courses covering basic digital skills",
                    "provider": {
                      "@type": "EducationalOrganization",
                      "name": "Digital Career Center"
                    }
                  },
                  {
                    "@type": "Course",
                    "name": "Search Engine Optimization (SEO)",
                    "description": "Complete SEO training with 25 courses and 85 hours of content",
                    "provider": {
                      "@type": "EducationalOrganization",
                      "name": "Digital Career Center"
                    }
                  },
                  {
                    "@type": "Course",
                    "name": "Digital Marketing",
                    "description": "Comprehensive digital marketing training program",
                    "provider": {
                      "@type": "EducationalOrganization",
                      "name": "Digital Career Center"
                    }
                  }
                ]
              }
            })
          }}
        />
        {/* JSON-LD Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Digital Career Center",
              "url": siteUrl,
              "description": "Digital Career Center - Transform Your Career with Expert-Led Digital Skills Courses",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${siteUrl}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "EducationalOrganization",
                "name": "Digital Career Center",
                "url": siteUrl
              }
            })
          }}
        />
      </head>
      <body className={`${poppins.variable} font-poppins antialiased flex flex-col min-h-screen bg-slate-50`}>
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
