import { describe, expect, it } from 'vitest';
import {
  createDeliverableSchema,
  createLinkVersionSchema,
  updateDeliverableSchema,
} from '../src/deliverable.js';

describe('createDeliverableSchema', () => {
  it('accepts a valid title', () => {
    const result = createDeliverableSchema.safeParse({ title: 'Landing page' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('trims and drops empty description', () => {
    const result = createDeliverableSchema.safeParse({
      title: ' Hero section ',
      description: '   ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Hero section');
      expect(result.data.description).toBeUndefined();
    }
  });

  it('rejects an empty title', () => {
    const result = createDeliverableSchema.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a title over 255 characters', () => {
    const result = createDeliverableSchema.safeParse({ title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe('updateDeliverableSchema', () => {
  it('accepts at least one field', () => {
    const result = updateDeliverableSchema.safeParse({ title: 'New title' });
    expect(result.success).toBe(true);
  });

  it('accepts a null description as a clear operation', () => {
    const result = updateDeliverableSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it('requires at least one field', () => {
    const result = updateDeliverableSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('createLinkVersionSchema', () => {
  it('accepts a valid URL', () => {
    const result = createLinkVersionSchema.safeParse({
      externalUrl: 'https://figma.com/file/design-v2',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL value', () => {
    const result = createLinkVersionSchema.safeParse({ externalUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects a URL over 2048 characters', () => {
    const result = createLinkVersionSchema.safeParse({
      externalUrl: `https://example.com/${'a'.repeat(2100)}`,
    });
    expect(result.success).toBe(false);
  });
});
