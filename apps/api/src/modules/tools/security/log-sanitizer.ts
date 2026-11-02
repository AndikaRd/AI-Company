/**
 * Security Audit Log Sanitizer
 * Redacts secrets, tokens, credentials, and truncates large payloads before database persistence.
 */
export class LogSanitizer {
  private static readonly SENSITIVE_KEY_PATTERN =
    /(password|passwd|secret|token|apiKey|api_key|authToken|auth_token|clientSecret|client_secret|privateKey|private_key|authorization)/i;

  private static readonly BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
  private static readonly PRIVATE_KEY_PATTERN = /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/gi;
  private static readonly URL_CREDENTIAL_PATTERN = /:\/\/([^:]+):([^@]+)@/gi;
  private static readonly API_KEY_PATTERNS = /(ghp_|gho_|xoxb-|sk_live_|sk_test_|AIzaSy)[A-Za-z0-9_=-]+/gi;
  private static readonly JWT_PATTERN = /eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_.+/=]*/gi;

  private static readonly MAX_STRING_LENGTH = 4096;

  /**
   * Sanitizes arbitrary payload (objects, arrays, strings, primitives)
   */
  static sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === 'object') {
      // Handle Date, RegExp, Error instances
      if (data instanceof Date || data instanceof RegExp) {
        return data;
      }
      if (data instanceof Error) {
        return {
          name: data.name,
          message: this.sanitizeString(data.message),
          stack: data.stack ? this.sanitizeString(data.stack) : undefined,
        };
      }

      const sanitizedObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.SENSITIVE_KEY_PATTERN.test(key)) {
          sanitizedObj[key] = '[REDACTED_CREDENTIAL]';
        } else {
          sanitizedObj[key] = this.sanitize(value);
        }
      }
      return sanitizedObj;
    }

    return data;
  }

  /**
   * Sanitizes text strings against credential patterns and caps length
   */
  static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    let sanitized = input
      .replace(this.PRIVATE_KEY_PATTERN, '[REDACTED_PRIVATE_KEY]')
      .replace(this.BEARER_PATTERN, 'Bearer [REDACTED_TOKEN]')
      .replace(this.URL_CREDENTIAL_PATTERN, '://$1:[REDACTED_PASSWORD]@')
      .replace(this.API_KEY_PATTERNS, '[REDACTED_API_KEY]')
      .replace(this.JWT_PATTERN, '[REDACTED_JWT]');

    // Truncate extreme strings (e.g. huge source files or memory dumps)
    if (sanitized.length > this.MAX_STRING_LENGTH) {
      const originalLength = sanitized.length;
      sanitized =
        sanitized.slice(0, this.MAX_STRING_LENGTH) +
        `\n... [TRUNCATED_FOR_AUDIT: total length ${originalLength} characters]`;
    }

    return sanitized;
  }
}

