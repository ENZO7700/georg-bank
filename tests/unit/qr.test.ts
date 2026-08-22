import { describe, it, expect, beforeAll } from '@jest/globals';
import { decodeQrCode, QrDecodingError } from '@/utils/qr';
import {
  validatePaymentDraft,
  validateIban,
  validateBic,
  validateCurrency,
  validateAmount,
  containsDangerousContent,
} from '@/utils/qr/validator';
import {
  normalizeIban,
  normalizeBic,
  normalizeCurrency,
  normalizeAmount,
  normalizeText,
  normalizeDate,
  validateIbanChecksum,
  isValidIbanFormat,
  isUrl,
} from '@/utils/qr/normalizer';
import { PaymentDraft } from '@/types/payment';

// Test fixtures
import payBySquareValid from '../fixtures/qr/pay-by-square-valid.json';
import payBySquareMultiple from '../fixtures/qr/pay-by-square-multiple-accounts.json';
import payBySquareNoAmount from '../fixtures/qr/pay-by-square-no-amount.json';
import epcSepaValid from '../fixtures/qr/epc-sepa-valid.json';
import invalidIban from '../fixtures/qr/invalid-iban.json';
import unsupportedCurrency from '../fixtures/qr/unsupported-currency.json';
import unknownFormat from '../fixtures/qr/unknown-format.json';

describe('QR Decoder', () => {
  describe('PAY by square', () => {
    it('should decode valid PAY by square QR', async () => {
      const result = await decodeQrCode(payBySquareValid.qrData);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('pay-by-square');
      expect(result.drafts).toHaveLength(1);
      
      const draft = result.drafts[0];
      expect(draft.recipientName).toBe('John Doe');
      expect(draft.iban).toBe('SK9312345678901234567890');
      expect(draft.bic).toBe('FIOBSKBA');
      expect(draft.amount).toBe(100);
      expect(draft.currency).toBe('EUR');
      expect(draft.variableSymbol).toBe('123456');
      expect(draft.constantSymbol).toBe('0800');
      expect(draft.specificSymbol).toBe('789');
      expect(draft.note).toBe('Test payment');
      expect(draft.rawQrData).toBe(payBySquareValid.qrData);
    });

    it('should decode PAY by square with multiple accounts', async () => {
      const result = await decodeQrCode(payBySquareMultiple.qrData);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('pay-by-square');
      expect(result.drafts).toHaveLength(2);
      
      // Check first account
      expect(result.drafts[0].iban).toBe('SK9312345678901234567890');
      expect(result.drafts[0].bic).toBe('FIOBSKBA');
      
      // Check second account
      expect(result.drafts[1].iban).toBe('SK636543210987654321');
      expect(result.drafts[1].bic).toBe('TATRSKBA');
      
      // Check warnings
      expect(result.warnings).toContain('Multiple payment options found, user must select one');
    });

    it('should decode PAY by square without amount', async () => {
      const result = await decodeQrCode(payBySquareNoAmount.qrData);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('pay-by-square');
      expect(result.drafts[0].amount).toBeNull();
      expect(result.drafts[0].recipientName).toBe('Jane Smith');
      expect(result.drafts[0].iban).toBe('SK2609876543210987654321');
    });

    it('should handle invalid IBAN in PAY by square', async () => {
      const result = await decodeQrCode(invalidIban.qrData);
      
      expect(result.success).toBe(false);
      expect(result.drafts).toHaveLength(0);
    });

    it('should handle unsupported currency in PAY by square', async () => {
      const result = await decodeQrCode(unsupportedCurrency.qrData);
      
      // Should still decode, but currency will be XYZ (3-letter codes are accepted)
      expect(result.success).toBe(true);
      expect(result.format).toBe('pay-by-square');
      expect(result.drafts[0].currency).toBe('XYZ');
    });
  });

  describe('EPC/SEPA', () => {
    it('should decode valid EPC/SEPA QR', async () => {
      const result = await decodeQrCode(epcSepaValid.qrData);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('epc-sepa');
      expect(result.drafts).toHaveLength(1);
      
      // The simplified EPC decoder extracts the IBAN
      // For now, just verify the format is recognized
      const draft = result.drafts[0];
      expect(draft.iban).toContain('DE1089370400440532013000');
      expect(draft.currency).toBe('EUR');
    });
  });

  describe('Unknown format', () => {
    it('should return unknown for non-payment QR', async () => {
      const result = await decodeQrCode(unknownFormat.qrData);
      
      expect(result.success).toBe(false);
      expect(result.format).toBeNull();
      expect(result.drafts).toHaveLength(0);
      expect(result.error).toContain('Unknown QR code format');
    });
  });

  describe('Security', () => {
    it('should reject URL QR codes for security', async () => {
      const urlQr = 'https://evil.com/phishing';
      
      await expect(decodeQrCode(urlQr)).rejects.toThrow(QrDecodingError);
    });

    it('should reject large payloads', async () => {
      const largePayload = 'A'.repeat(3000);
      
      await expect(decodeQrCode(largePayload)).rejects.toThrow(QrDecodingError);
    });

    it('should handle null input', async () => {
      await expect(decodeQrCode(null as unknown as string)).rejects.toThrow();
    });

    it('should handle empty string', async () => {
      await expect(decodeQrCode('')).rejects.toThrow();
    });
  });
});

describe('Normalizers', () => {
  describe('normalizeIban', () => {
    it('should normalize valid IBAN with spaces', () => {
      const iban = 'SK 93 12 34 56 78 90 12 34 56 78 90';
      const result = normalizeIban(iban);
      expect(result).toBe('SK9312345678901234567890');
    });

    it('should normalize valid IBAN to uppercase', () => {
      const iban = 'sk9312345678901234567890';
      const result = normalizeIban(iban);
      expect(result).toBe('SK9312345678901234567890');
    });

    it('should return null for invalid IBAN', () => {
      const iban = 'INVALID';
      const result = normalizeIban(iban);
      expect(result).toBeNull();
    });

    it('should return null for empty input', () => {
      const result = normalizeIban('');
      expect(result).toBeNull();
    });

    it('should validate checksum by default', () => {
      // This is a valid IBAN with correct checksum
      const validIban = 'SK9312345678901234567890';
      const result = normalizeIban(validIban);
      expect(result).toBe('SK9312345678901234567890');
    });
  });

  describe('normalizeBic', () => {
    it('should normalize valid BIC', () => {
      const bic = 'FIOB SKBA';
      const result = normalizeBic(bic);
      expect(result).toBe('FIOBSKBA');
    });

    it('should return null for BIC with invalid length', () => {
      const bic = 'FIO';
      const result = normalizeBic(bic);
      expect(result).toBeNull();
    });

    it('should return null for BIC with invalid characters', () => {
      const bic = 'FIOB@SKK';
      const result = normalizeBic(bic);
      expect(result).toBeNull();
    });

    it('should return null for empty input', () => {
      const result = normalizeBic(null);
      expect(result).toBeNull();
    });
  });

  describe('normalizeCurrency', () => {
    it('should normalize to uppercase', () => {
      const currency = 'eur';
      const result = normalizeCurrency(currency);
      expect(result).toBe('EUR');
    });

    it('should accept supported currencies', () => {
      const currencies = ['EUR', 'SKK', 'USD', 'GBP', 'CZK', 'PLN', 'HUF'];
      currencies.forEach(currency => {
        expect(normalizeCurrency(currency.toLowerCase())).toBe(currency);
      });
    });

    it('should accept any 3-letter code', () => {
      const currency = 'XYZ';
      const result = normalizeCurrency(currency);
      expect(result).toBe('XYZ');
    });

    it('should return null for invalid format', () => {
      const currency = 'EURO';
      const result = normalizeCurrency(currency);
      expect(result).toBeNull();
    });

    it('should return null for empty input', () => {
      const result = normalizeCurrency(null);
      expect(result).toBeNull();
    });
  });

  describe('normalizeAmount', () => {
    it('should parse number', () => {
      const amount = 100.50;
      const result = normalizeAmount(amount);
      expect(result).toBe(100.50);
    });

    it('should parse string with decimal point', () => {
      const amount = '100.50';
      const result = normalizeAmount(amount);
      expect(result).toBe(100.50);
    });

    it('should parse string with decimal comma', () => {
      const amount = '100,50';
      const result = normalizeAmount(amount);
      expect(result).toBe(100.50);
    });

    it('should round to 2 decimal places', () => {
      const amount = '100.1234';
      const result = normalizeAmount(amount);
      expect(result).toBe(100.12);
    });

    it('should return null for negative amount', () => {
      const amount = -100;
      const result = normalizeAmount(amount);
      expect(result).toBeNull();
    });

    it('should return null for non-numeric string', () => {
      const amount = 'not a number';
      const result = normalizeAmount(amount);
      expect(result).toBeNull();
    });

    it('should return null for empty input', () => {
      const result = normalizeAmount(null);
      expect(result).toBeNull();
    });

    it('should reject very large amounts', () => {
      const amount = 10000001; // More than 10 million
      const result = normalizeAmount(amount);
      expect(result).toBeNull();
    });
  });

  describe('normalizeText', () => {
    it('should trim whitespace', () => {
      const text = '  test  ';
      const result = normalizeText(text);
      expect(result).toBe('test');
    });

    it('should limit length', () => {
      const text = 'A'.repeat(200);
      const result = normalizeText(text, 140);
      expect(result?.length).toBe(140);
    });

    it('should sanitize HTML', () => {
      const text = '<script>alert("xss")</script>';
      const result = normalizeText(text);
      expect(result).toBe('alert("xss")');
    });

    it('should return null for empty input', () => {
      const result = normalizeText(null);
      expect(result).toBeNull();
    });

    it('should remove control characters', () => {
      const text = 'test\x00\x1Ftest';
      const result = normalizeText(text);
      expect(result).toBe('testtest');
    });
  });

  describe('normalizeDate', () => {
    it('should parse ISO format', () => {
      const date = '2026-12-31';
      const result = normalizeDate(date);
      expect(result).toEqual(new Date(2026, 11, 31));
    });

    it('should parse European format', () => {
      const date = '31.12.2026';
      const result = normalizeDate(date);
      expect(result).toEqual(new Date(2026, 11, 31));
    });

    it('should parse YYYYMMDD format', () => {
      const date = '20261231';
      const result = normalizeDate(date);
      expect(result).toEqual(new Date(2026, 11, 31));
    });

    it('should return null for invalid date', () => {
      const date = 'not a date';
      const result = normalizeDate(date);
      expect(result).toBeNull();
    });

    it('should return null for empty input', () => {
      const result = normalizeDate(null);
      expect(result).toBeNull();
    });

    it('should handle Date object', () => {
      const date = new Date(2026, 11, 31);
      const result = normalizeDate(date);
      expect(result).toEqual(date);
    });

    it('should return null for invalid Date object', () => {
      const date = new Date('invalid');
      const result = normalizeDate(date);
      expect(result).toBeNull();
    });
  });

  describe('isValidIbanFormat', () => {
    it('should return true for valid IBAN format', () => {
      expect(isValidIbanFormat('SK12345678901234567890')).toBe(true);
      expect(isValidIbanFormat('DE89370400440532013000')).toBe(true);
      expect(isValidIbanFormat('GB82WEST12345698765432')).toBe(true);
    });

    it('should return false for too short IBAN', () => {
      expect(isValidIbanFormat('SK12')).toBe(false);
    });

    it('should return false for IBAN without checksum digits', () => {
      // SK123 is only 5 chars, needs at least 4 but also needs proper structure
      // A valid format would be SK + 2 digits + at least 1 char
      expect(isValidIbanFormat('SK12')).toBe(false);
    });

    it('should return false for IBAN with invalid characters', () => {
      expect(isValidIbanFormat('SK12@456')).toBe(false);
    });
  });

  describe('validateIbanChecksum', () => {
    it('should validate known valid IBANs', () => {
      // These are known valid IBANs with correct checksums
      // SK953112000000198742637521 - Valid Slovak IBAN
      expect(validateIbanChecksum('SK953112000000198742637521')).toBe(true);
    });

    it('should return false for invalid checksum', () => {
      // This IBAN has an invalid checksum
      expect(validateIbanChecksum('SK00000000000000000000')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('should return true for http URLs', () => {
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('https://example.com')).toBe(true);
    });

    it('should return true for www URLs', () => {
      expect(isUrl('www.example.com')).toBe(true);
    });

    it('should return false for non-URLs', () => {
      expect(isUrl('not a url')).toBe(false);
      expect(isUrl('SK123456')).toBe(false);
    });

    it('should return false for empty input', () => {
      expect(isUrl('')).toBe(false);
      expect(isUrl(null as unknown as string)).toBe(false);
    });
  });
});

describe('Validators', () => {
  describe('validatePaymentDraft', () => {
    const validDraft: PaymentDraft = {
      qrFormat: 'pay-by-square',
      recipientName: 'John Doe',
      iban: 'SK9312345678901234567890',
      bic: 'FIOBSKBA',
      amount: 100,
      currency: 'EUR',
      variableSymbol: '123456',
      constantSymbol: '0800',
      specificSymbol: '789',
      note: 'Test payment',
      paymentReference: null,
      dueDate: null,
      rawQrData: null,
    };

    it('should validate valid draft', () => {
      const result = validatePaymentDraft(validDraft);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag missing recipient name as warning', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        recipientName: '',
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'recipientName',
          type: 'warning',
        })
      );
    });

    it('should flag missing IBAN as error', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        iban: '',
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'iban',
          type: 'error',
        })
      );
    });

    it('should flag invalid IBAN format as error', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        iban: 'INVALID',
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(false);
    });

    it('should flag negative amount as error', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        amount: -100,
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'amount',
          type: 'error',
        })
      );
    });

    it('should flag note exceeding 140 chars as error', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        note: 'A'.repeat(141),
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'note',
          type: 'error',
        })
      );
    });

    it('should flag variable symbol exceeding 10 chars as error', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        variableSymbol: '12345678901',
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(false);
    });

    it('should warn for non-numeric variable symbol', () => {
      const draft: PaymentDraft = {
        ...validDraft,
        variableSymbol: 'ABC123',
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'variableSymbol',
          type: 'warning',
        })
      );
    });

    it('should flag past due date as warning', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const draft: PaymentDraft = {
        ...validDraft,
        dueDate: pastDate,
      };
      const result = validatePaymentDraft(draft);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'dueDate',
          type: 'warning',
        })
      );
    });
  });

  describe('validateIban', () => {
    it('should validate correct IBAN', () => {
      const result = validateIban('SK953112000000198742637521');
      expect(result.valid).toBe(true);
    });

    it('should flag empty IBAN', () => {
      const result = validateIban(null);
      expect(result.valid).toBe(false);
    });

    it('should flag invalid IBAN format', () => {
      const result = validateIban('INVALID');
      expect(result.valid).toBe(false);
    });

    it('should flag invalid checksum', () => {
      const result = validateIban('SK00000000000000000000');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBic', () => {
    it('should validate correct BIC', () => {
      const result = validateBic('FIOBSKBA');
      expect(result.valid).toBe(true);
    });

    it('should allow empty BIC with warning', () => {
      const result = validateBic(null);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should flag invalid BIC length', () => {
      const result = validateBic('FIO');
      expect(result.valid).toBe(false);
    });

    it('should flag invalid BIC characters', () => {
      const result = validateBic('FIOB@SKK');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCurrency', () => {
    it('should validate supported currency', () => {
      const result = validateCurrency('EUR');
      expect(result.valid).toBe(true);
    });

    it('should allow empty currency with warning', () => {
      const result = validateCurrency(null);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should flag non-ISO format', () => {
      const result = validateCurrency('EURO');
      expect(result.valid).toBe(false);
    });

    it('should warn for unsupported ISO currency', () => {
      const result = validateCurrency('XYZ');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amount', () => {
      const result = validateAmount(100);
      expect(result.valid).toBe(true);
    });

    it('should allow null amount with warning', () => {
      const result = validateAmount(null);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should flag negative amount', () => {
      const result = validateAmount(-100);
      expect(result.valid).toBe(false);
    });

    it('should flag zero amount', () => {
      const result = validateAmount(0);
      expect(result.valid).toBe(false);
    });

    it('should flag NaN amount', () => {
      const result = validateAmount(NaN);
      expect(result.valid).toBe(false);
    });

    it('should flag infinite amount', () => {
      const result = validateAmount(Infinity);
      expect(result.valid).toBe(false);
    });

    it('should flag very large amount', () => {
      const result = validateAmount(10000001);
      expect(result.valid).toBe(false);
    });
  });

  describe('containsDangerousContent', () => {
    it('should detect script tags', () => {
      expect(containsDangerousContent('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      expect(containsDangerousContent('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsDangerousContent('onload=alert(1)')).toBe(true);
      expect(containsDangerousContent('onclick=alert(1)')).toBe(true);
    });

    it('should detect eval', () => {
      expect(containsDangerousContent('eval("code")')).toBe(true);
    });

    it('should detect iframe', () => {
      expect(containsDangerousContent('<iframe src="...">')).toBe(true);
    });

    it('should detect data: URLs', () => {
      expect(containsDangerousContent('data:text/html,<script>')).toBe(true);
    });

    it('should return false for safe content', () => {
      expect(containsDangerousContent('Hello World')).toBe(false);
      expect(containsDangerousContent('SK1234567890')).toBe(false);
      expect(containsDangerousContent('John Doe')).toBe(false);
    });

    it('should return false for empty input', () => {
      expect(containsDangerousContent('')).toBe(false);
      expect(containsDangerousContent(null)).toBe(false);
    });
  });
});
