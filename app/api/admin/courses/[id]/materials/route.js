import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
}

export async function GET(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();

    const { id } = await params;
    const course = await Course.findById(id).select('title materials');
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const materials = [...(course.materials || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    return NextResponse.json({
      success: true,
      courseTitle: course.title,
      materials,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch materials' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { title, description = '', fileUrl, fileName, fileSize, mimeType, isFreePreview = false } = body;

    if (!title?.trim() || !fileUrl?.trim()) {
      return NextResponse.json(
        { error: 'Title and PDF file are required.' },
        { status: 400 }
      );
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const nextOrder =
      course.materials?.length > 0
        ? Math.max(...course.materials.map((m) => m.order || 0)) + 1
        : 1;

    course.materials.push({
      title: title.trim(),
      description: description.trim(),
      fileUrl: fileUrl.trim(),
      fileName: fileName || title.trim(),
      fileSize: fileSize || 0,
      mimeType: mimeType || 'application/pdf',
      order: nextOrder,
      isFreePreview: Boolean(isFreePreview),
      uploadedAt: new Date(),
    });

    await course.save();

    const added = course.materials[course.materials.length - 1];
    return NextResponse.json({
      success: true,
      message: 'PDF added successfully',
      material: added,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to add PDF' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');

    if (!materialId) {
      return NextResponse.json({ error: 'materialId is required' }, { status: 400 });
    }

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const before = course.materials.length;
    course.materials = course.materials.filter((m) => m._id.toString() !== materialId);
    if (course.materials.length === before) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    await course.save();
    return NextResponse.json({ success: true, message: 'PDF removed' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete PDF' }, { status: 500 });
  }
}
