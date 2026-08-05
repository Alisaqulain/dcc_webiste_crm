import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import ServiceInquiry from '@/models/ServiceInquiry';
import { slugify } from '@/lib/slugify';
import { sendEmail } from '@/lib/email';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { slug } = await params;
    const body = await request.json();
    const { name, email, phone, websiteUrl, message } = body;

    if (!name?.trim() || !email?.trim()) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const service = await Service.findOne({ slug: slugify(slug), isPublished: true }).lean();
    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }

    const inquiry = await ServiceInquiry.create({
      serviceId: service._id,
      serviceTitle: service.title,
      serviceSlug: service.slug,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      websiteUrl: websiteUrl?.trim() || '',
      message: message?.trim() || '',
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `New service enquiry: ${service.title}`,
          html: `
            <h2>New enquiry for ${service.title}</h2>
            <p><strong>Name:</strong> ${inquiry.name}</p>
            <p><strong>Email:</strong> ${inquiry.email}</p>
            <p><strong>Phone:</strong> ${inquiry.phone || '—'}</p>
            <p><strong>Website:</strong> ${inquiry.websiteUrl || '—'}</p>
            <p><strong>Message:</strong></p>
            <p>${(inquiry.message || '—').replace(/\n/g, '<br>')}</p>
          `,
        });
      } catch (emailErr) {
        console.error('Service inquiry email failed:', emailErr);
      }
    }

    return Response.json({ success: true, message: 'Your enquiry has been submitted. We will contact you soon.' });
  } catch (error) {
    console.error('Service inquiry error:', error);
    return Response.json({ error: 'Failed to submit enquiry' }, { status: 500 });
  }
}
