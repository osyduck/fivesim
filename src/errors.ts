/**
 * Base error class for FiveSim API errors
 */
export class FiveSimError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'FiveSimError';
        Object.setPrototypeOf(this, FiveSimError.prototype);
    }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends FiveSimError {
    constructor(message = 'Invalid or missing API key') {
        super(message, 401);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends FiveSimError {
    constructor(message = 'Rate limit exceeded. Please wait before making more requests.') {
        super(message, 429);
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends FiveSimError {
    constructor(message = 'Service temporarily unavailable. Server-side limits reached.') {
        super(message, 503);
        this.name = 'ServiceUnavailableError';
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}

/**
 * No numbers available error
 */
export class NoNumbersError extends FiveSimError {
    constructor(message = 'No numbers available for the requested service/country/operator') {
        super(message, 400);
        this.name = 'NoNumbersError';
        Object.setPrototypeOf(this, NoNumbersError.prototype);
    }
}
