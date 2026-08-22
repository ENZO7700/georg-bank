import { prisma } from '@/lib/db/prisma';
import { RecipientContact, CreateRecipientContactDto } from '@/types/payment';
import { normalizeIban } from '@/utils/qr';

/**
 * Contact Service
 * 
 * Provides functionality for managing recipient contacts.
 * All operations are user-isolated (users can only access their own contacts).
 */

export class ContactService {
  /**
   * Gets all contacts for a user
   * 
   * @param userId - The user ID
   * @param options - Query options (search, pagination)
   * @returns Promise resolving to array of contacts and pagination info
   */
  static async getContacts(
    userId: string,
    options: {
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    contacts: RecipientContact[];
    total: number;
    hasMore: boolean;
  }> {
    const { search, limit = 100, offset = 0 } = options;

    // Validate parameters
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative');
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

    if (search && search.trim()) {
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

    // Get total count
    const total = await prisma.recipientContact.count({ where });

    return {
      contacts,
      total,
      hasMore: offset + contacts.length < total,
    };
  }

  /**
   * Gets a single contact by ID
   * 
   * @param contactId - The contact ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to the contact or null
   */
  static async getContactById(
    contactId: string,
    userId: string
  ): Promise<RecipientContact | null> {
    const contact = await prisma.recipientContact.findUnique({
      where: { id: contactId },
    });

    // Check if contact exists and belongs to user
    if (!contact || contact.userId !== userId) {
      return null;
    }

    return contact;
  }

  /**
   * Creates a new contact or updates an existing one (idempotent upsert)
   * 
   * @param userId - The user ID
   * @param data - Contact data
   * @returns Promise resolving to the created/updated contact
   */
  static async upsertContact(
    userId: string,
    data: CreateRecipientContactDto
  ): Promise<RecipientContact> {
    // Validate input
    if (!data.name || data.name.trim() === '') {
      throw new Error('Name is required');
    }

    if (!data.iban || data.iban.trim() === '') {
      throw new Error('IBAN is required');
    }

    // Normalize IBAN
    const normalizedIban = normalizeIban(data.iban);
    if (!normalizedIban) {
      throw new Error('Invalid IBAN format');
    }

    // Normalize BIC if provided
    let normalizedBic: string | null = null;
    if (data.bic) {
      const normalized = data.bic.replace(/\s+/g, '').toUpperCase();
      if (!/^[A-Z0-9]{8,11}$/.test(normalized)) {
        throw new Error('BIC must be 8-11 alphanumeric characters');
      }
      normalizedBic = normalized;
    }

    // Perform upsert
    return prisma.recipientContact.upsert({
      where: {
        userId_iban: {
          userId,
          iban: normalizedIban,
        },
      },
      create: {
        userId,
        name: data.name.trim(),
        iban: normalizedIban,
        bic: normalizedBic,
      },
      update: {
        name: data.name.trim(),
        iban: normalizedIban,
        bic: normalizedBic,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deletes a contact
   * 
   * @param contactId - The contact ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to true if deleted, false otherwise
   */
  static async deleteContact(
    contactId: string,
    userId: string
  ): Promise<boolean> {
    // Verify contact exists and belongs to user
    const contact = await prisma.recipientContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return false;
    }

    if (contact.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own contacts');
    }

    // Delete the contact
    await prisma.recipientContact.delete({
      where: { id: contactId },
    });

    return true;
  }

  /**
   * Checks if a contact with given IBAN exists for a user
   * 
   * @param userId - The user ID
   * @param iban - The IBAN to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  static async contactExists(userId: string, iban: string): Promise<boolean> {
    const normalizedIban = normalizeIban(iban);
    if (!normalizedIban) {
      return false;
    }

    const count = await prisma.recipientContact.count({
      where: {
        userId,
        iban: normalizedIban,
      },
    });

    return count > 0;
  }

  /**
   * Gets contacts by IBAN (useful for auto-completion)
   * 
   * @param userId - The user ID
   * @param iban - Partial or full IBAN to search
   * @returns Promise resolving to array of matching contacts
   */
  static async getContactsByIban(
    userId: string,
    iban: string
  ): Promise<RecipientContact[]> {
    const normalizedIban = iban.replace(/\s+/g, '').toUpperCase();

    return prisma.recipientContact.findMany({
      where: {
        userId,
        iban: {
          contains: normalizedIban,
          mode: 'insensitive',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });
  }

  /**
   * Gets frequently used contacts for a user
   * 
   * @param userId - The user ID
   * @param limit - Maximum number of contacts to return
   * @returns Promise resolving to array of frequently used contacts
   */
  static async getFrequentContacts(
    userId: string,
    limit: number = 10
  ): Promise<RecipientContact[]> {
    // For now, just return recently updated contacts
    // In the future, this could track actual usage frequency
    return prisma.recipientContact.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }
}

export default ContactService;
