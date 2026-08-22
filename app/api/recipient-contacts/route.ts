import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { normalizeIban } from '@/utils/qr';

/**
 * GET /api/recipient-contacts
 * 
 * Returns all recipient contacts for the authenticated user.
 * 
 * Query Parameters:
 * - search: Optional search string to filter contacts
 * - limit: Maximum number of contacts to return (default: 100)
 * - offset: Offset for pagination (default: 0)
 * 
 * Authentication: Required (via session)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    // For now, we'll use a mock user ID for development
    // In production, this should be extracted from the session
    const userId = request.headers.get('X-User-ID') || 'mock-user-id';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate query parameters
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter', message: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter', message: 'Offset must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: {
      userId: string;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        iban?: { contains: string };
        bic?: { contains: string; mode: 'insensitive' };
      }>;
    } = { userId };

    if (search.trim()) {
      const normalizedSearch = search.replace(/\s+/g, '').toUpperCase();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { iban: { contains: normalizedSearch } },
        { bic: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch contacts
    const contacts = await prisma.recipientContact.findMany({
      where,
      orderBy: [
        { updatedAt: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.recipientContact.count({ where });

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + contacts.length < total,
      },
    });
  } catch (error) {
    console.error('GET /api/recipient-contacts error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipient-contacts
 * 
 * Creates a new recipient contact or updates an existing one (idempotent upsert).
 * 
 * Request Body:
 * - name: Recipient name (required)
 * - iban: IBAN (required, normalized)
 * - bic: BIC/SWIFT code (optional)
 * 
 * Authentication: Required (via session)
 * 
 * Idempotency: If a contact with the same userId and normalized IBAN already exists,
 * it will be updated with the new data.
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('X-User-ID') || 'mock-user-id';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!body.iban || typeof body.iban !== 'string' || body.iban.trim() === '') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'IBAN is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Normalize IBAN
    const normalizedIban = normalizeIban(body.iban);
    if (!normalizedIban) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid IBAN format' },
        { status: 400 }
      );
    }

    // Normalize BIC if provided
    let normalizedBic: string | null = null;
    if (body.bic) {
      const normalized = body.bic.replace(/\s+/g, '').toUpperCase();
      if (/^[A-Z0-9]{8,11}$/.test(normalized)) {
        normalizedBic = normalized;
      } else {
        return NextResponse.json(
          { error: 'Validation Error', message: 'BIC must be 8-11 alphanumeric characters' },
          { status: 400 }
        );
      }
    }

    // Perform idempotent upsert
    const contact = await prisma.recipientContact.upsert({
      where: {
        userId_iban: {
          userId,
          iban: normalizedIban,
        },
      },
      create: {
        userId,
        name: body.name.trim(),
        iban: normalizedIban,
        bic: normalizedBic,
      },
      update: {
        name: body.name.trim(),
        iban: normalizedIban,
        bic: normalizedBic,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: contact,
      message: 'Contact saved successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('POST /api/recipient-contacts error:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: 'A contact with this IBAN already exists for this user',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipient-contacts/:id
 * 
 * Deletes a recipient contact.
 * 
 * Authentication: Required (via session)
 * Authorization: User must own the contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('X-User-ID') || 'mock-user-id';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Verify contact exists and belongs to user
    const contact = await prisma.recipientContact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Contact not found' },
        { status: 404 }
      );
    }

    if (contact.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own contacts' },
        { status: 403 }
      );
    }

    // Delete the contact
    await prisma.recipientContact.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/recipient-contacts/:id error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
