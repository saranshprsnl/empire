import { z } from 'zod';

/**
 * Custom Zod validation rule that automatically strips HTML tags
 * from string values to mitigate XSS (Cross-Site Scripting) vectors.
 */
export const sanitizedString = z.string().transform((val) => {
  return val.replace(/<[^>]*>/g, '').trim();
});

export default sanitizedString;
