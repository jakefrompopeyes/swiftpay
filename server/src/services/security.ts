import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface SecurityConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  enableCORS: boolean;
  enableHelmet: boolean;
  enableRateLimit: boolean;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;

  private constructor() {
    this.config = {
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      enableCORS: true,
      enableHelmet: true,
      enableRateLimit: true
    };
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Generate secure random strings
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data
  public hashData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  // Verify hashed data
  public verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  }

  // Encrypt sensitive data
  public encryptData(data: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  // Decrypt sensitive data
  public decryptData(encryptedData: string, key: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Validate input data
  public validateInput(data: any, schema: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic validation rules
    if (typeof data !== 'object' || data === null) {
      errors.push('Invalid data format');
      return { isValid: false, errors };
    }

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i
    ];

    const dataString = JSON.stringify(data);
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(dataString)) {
        errors.push('Potential SQL injection detected');
        break;
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(dataString)) {
        errors.push('Potential XSS attack detected');
        break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Sanitize input data
  public sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes
        .trim();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return data;
  }

  // Generate API key
  public generateApiKey(): string {
    return `sp_${this.generateSecureToken(24)}`;
  }

  // Validate API key format
  public validateApiKey(apiKey: string): boolean {
    const apiKeyPattern = /^sp_[a-f0-9]{48}$/;
    return apiKeyPattern.test(apiKey);
  }

  // Security middleware
  public securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Log security events
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        console.warn(`Suspicious user agent detected: ${userAgent} from ${req.ip}`);
        break;
      }
    }

    next();
  };

  // Rate limiting middleware
  public rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // This is a simplified rate limiter - in production, use Redis
    if (!req.session) {
      req.session = {} as any;
    }

    if (!req.session.rateLimit) {
      req.session.rateLimit = {
        requests: [],
        lastReset: now
      };
    }

    const rateLimit = req.session.rateLimit;
    
    // Clean old requests
    rateLimit.requests = rateLimit.requests.filter(
      (timestamp: number) => now - timestamp < windowMs
    );

    // Check if limit exceeded
    if (rateLimit.requests.length >= this.config.maxRequestsPerMinute) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }

    // Add current request
    rateLimit.requests.push(now);
    next();
  };
}

