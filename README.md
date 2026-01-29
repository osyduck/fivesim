# fivesim

TypeScript client for [5sim.net](https://5sim.net) SMS verification API. Get virtual phone numbers for receiving SMS verification codes.

## Installation

```bash
npm install fivesim
```

## Quick Start

```typescript
import { FiveSimClient } from 'fivesim';

const client = new FiveSimClient({ apiKey: 'your-api-key' });

// Get balance
const profile = await client.getProfile();
console.log(`Balance: $${profile.balance}`);

// Buy a number for Telegram in Russia
const order = await client.buyActivation({
  country: 'russia',
  operator: 'any',
  product: 'telegram',
});
console.log(`Phone: ${order.phone}, ID: ${order.id}`);

// Poll for SMS
const status = await client.checkOrder(order.id);
if (status.sms && status.sms.length > 0) {
  console.log(`Received code: ${status.sms[0].code}`);
  // Complete order
  await client.finishOrder(order.id);
}
```

## API Reference

### Constructor

```typescript
const client = new FiveSimClient({
  apiKey: string,        // Required: Your 5sim.net API key
  baseUrl?: string,      // Optional: Custom API URL
  timeout?: number,      // Optional: Request timeout in ms (default: 30000)
});
```

### User Information

#### getProfile()
Get user profile and balance information.

```typescript
const profile = await client.getProfile();
// Returns: { id, email, balance, rating, default_country, ... }
```

#### getOrderHistory(options?)
Get order history with optional filtering.

```typescript
const history = await client.getOrderHistory({
  category: 'activation',  // 'activation' or 'hosting'
  limit: 10,
  offset: 0,
});
```

### Guest Access (No Authentication)

#### getCountries()
Get list of available countries.

```typescript
const countries = await client.getCountries();
// Returns: { russia: { name: 'Russia', iso: 'ru', prefix: '7' }, ... }
```

#### getProducts(country, operator)
Get available products for a country and operator.

```typescript
const products = await client.getProducts('russia', 'any');
// Returns: { telegram: { category: 'social', qty: 50, price: 0.5 }, ... }
```

#### getPrices(options?)
Get prices for products.

```typescript
const prices = await client.getPrices({
  country: 'russia',
  product: 'telegram',
});
```

### Purchase

#### buyActivation(options)
Buy an activation number.

```typescript
const order = await client.buyActivation({
  country: 'russia',     // Country code or 'any'
  operator: 'any',       // Operator name or 'any'
  product: 'telegram',   // Product/service name
  forwarding?: '1',      // Optional forwarding
});
// Returns: Order with id, phone, status, etc.
```

#### buyHosting(options)
Buy a hosting number (long-term rental).

```typescript
const order = await client.buyHosting({
  country: 'russia',
  operator: 'any',
  product: 'telegram',
});
```

### Order Management

#### checkOrder(id)
Check order status and retrieve SMS messages.

```typescript
const order = await client.checkOrder(12345);
// Returns: Order with sms array
```

#### finishOrder(id)
Complete an order after receiving SMS.

```typescript
await client.finishOrder(12345);
```

#### cancelOrder(id)
Cancel an order and get refund.

```typescript
await client.cancelOrder(12345);
```

#### banNumber(id)
Report a number as already used on target service.

```typescript
await client.banNumber(12345);
```

## Order Statuses

- `PENDING` - Number purchased, waiting for SMS
- `RECEIVED` - SMS received
- `FINISHED` - Order completed successfully
- `CANCELED` - Order canceled, refund processed
- `TIMEOUT` - Order expired without receiving SMS
- `BANNED` - Number banned/reported

## Error Handling

The library provides custom error classes:

```typescript
import { 
  FiveSimError,
  AuthenticationError,
  RateLimitError,
  ServiceUnavailableError,
  NoNumbersError,
} from 'fivesim';

try {
  const order = await client.buyActivation({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, wait before retrying');
  } else if (error instanceof NoNumbersError) {
    console.error('No numbers available for this service');
  }
}
```

## Rate Limits

5sim API has the following limits:
- 100 requests per second per IP address
- 100 requests per second per API key
- 100 "buy number" requests per second
- Exceeding limits 5 times in 10 minutes results in a 10-minute ban

## Example Usage

See [examples/test-api.ts](./examples/test-api.ts) for a complete example:

```bash
# Set your API key
export FIVESIM_API_KEY=your-api-key

# Run basic tests
npx tsx examples/test-api.ts

# Run full activation test (WARNING: uses credits!)
npx tsx examples/test-api.ts --activate
```

## TypeScript Support

This library is written in TypeScript and includes full type definitions. All API methods are fully typed.

## License

MIT

## Links

- [5sim.net Official Website](https://5sim.net)
- [5sim API Documentation](https://5sim.net/docs)
- [Get API Key](https://5sim.net/settings/security)
