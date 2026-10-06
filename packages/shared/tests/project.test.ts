import { describe, expect, it } from 'vitest';
import { createProjectSchema, projectStatusSchema } from '../src/project.js';

describe('projectStatusSchema', () => {
  it('accepts planning', () => {
    expect(projectStatusSchema.safeParse('planning').success).toBe(true);
  });

  it('rejects bogus status', () => {
    expect(projectStatusSchema.safeParse('done').success).toBe(false);
  });
});

describe('createProjectSchema', () => {
  it('accepts valid create', () => {
    const result = createProjectSchema.safeParse({
      title: 'Site',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createProjectSchema.safeParse({
      title: '  ',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});
