/**
 * Example script to test 5sim API with a real API key
 * 
 * Usage:
 *   npx tsx examples/test-api.ts YOUR_API_KEY
 * 
 * Or set environment variable:
 *   FIVESIM_API_KEY=your-key npx tsx examples/test-api.ts
 */

import { FiveSimClient, NoNumbersError, OrderStatus } from '../src';

async function main() {
    const apiKey = process.argv[2] || process.env.FIVESIM_API_KEY;

    if (!apiKey) {
        console.error('❌ Please provide API key as argument or set FIVESIM_API_KEY env var');
        console.error('   Usage: npx tsx examples/test-api.ts YOUR_API_KEY');
        process.exit(1);
    }

    const client = new FiveSimClient({ apiKey });

    console.log('🔄 Testing 5sim API...\n');

    // Test 1: Get Profile & Balance
    try {
        const profile = await client.getProfile();
        console.log(`✅ Balance: $${profile.balance}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Rating: ${profile.rating}`);
    } catch (error) {
        console.error('❌ Failed to get profile:', error);
        process.exit(1);
    }

    // Test 2: Get Countries
    try {
        const countries = await client.getCountries();
        const countryList = Object.values(countries);
        console.log(`✅ Countries available: ${countryList.length}`);
        console.log(`   First 5: ${countryList.slice(0, 5).map(c => c.text_en).join(', ')}`);
    } catch (error) {
        console.error('❌ Failed to get countries:', error);
    }

    // Test 3: Get Products for Indonesia
    try {
        const products = await client.getProducts('indonesia', 'any');
        const productList = Object.entries(products);
        console.log(`✅ Products available for Indonesia: ${productList.length}`);
        console.log(`   First 5: ${productList.slice(0, 5).map(([name]) => name).join(', ')}`);
    } catch (error) {
        console.error('❌ Failed to get products:', error);
    }

    // Test 4: Get Prices for Forecoffee in Indonesia
    try {
        const prices = await client.getPrices({ country: 'indonesia', product: 'forecoffee' });
        console.log(`✅ Prices fetched for Forecoffee in Indonesia`);

        // Prices structure: { country: { product: { operator: { cost, count, rate, ... } } } }
        const countryData = Object.entries(prices)[0];
        if (countryData) {
            const [country, products] = countryData;
            const productData = Object.entries(products)[0];
            if (productData) {
                const [product, operators] = productData;
                console.log(`   Operators available: ${Object.keys(operators).length}`);

                // Display all operators with their rates
                Object.entries(operators).forEach(([operator, priceInfo]) => {
                    console.log(`\n   📱 ${operator}:`);
                    console.log(`      Cost: $${priceInfo.cost}`);
                    console.log(`      Available: ${priceInfo.count}`);
                    if (priceInfo.rate !== undefined) {
                        console.log(`      Rates: 1h=${priceInfo.rate1}% | 24h=${priceInfo.rate24}% | 72h=${priceInfo.rate72}%`);
                    }
                });
            }
        }
    } catch (error) {
        console.error('❌ Failed to get prices:', error);
    }

    // Test 5: Get Order History
    try {
        const history = await client.getOrderHistory({ category: 'activation' as any, limit: 5 });
        console.log(`✅ Order history fetched: ${history.data?.length || 0} recent orders`);
    } catch (error) {
        console.error('❌ Failed to get order history:', error);
    }

    console.log('\n✨ All basic tests completed!');

    // Check if user wants to test full activation flow
    if (process.argv.includes('--activate')) {
        console.log('\n--- Running Full Activation Flow ---');
        await testActivation(client);
    } else {
        console.log('\n💡 To test number activation, run with --activate flag:');
        console.log('   npx tsx examples/test-api.ts YOUR_API_KEY --activate');
        console.log('   ⚠️  WARNING: This will purchase a real number and use credits!');
    }
}

// Full activation flow
async function testActivation(client: FiveSimClient) {
    try {
        // Get a number for Telegram in Indonesia
        console.log('🔄 Requesting number for Telegram...');
        const order = await client.buyActivation({
            country: 'indonesia',
            operator: 'any',
            product: 'telegram',
        });
        console.log(`✅ Got number: ${order.phone} (ID: ${order.id})`);
        console.log(`   Price: $${order.price}`);
        console.log(`   Expires: ${order.expires}`);

        // Note: 5sim auto-activates, no need to mark ready

        // Poll for SMS (try 12 times with 10s delay = 2 minutes)
        console.log('⏳ Waiting for SMS...');
        for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 10000));

            const status = await client.checkOrder(order.id);
            console.log(`   Status: ${status.status} - SMS received: ${status.sms?.length || 0}`);

            if (status.status === OrderStatus.RECEIVED && status.sms && status.sms.length > 0) {
                const sms = status.sms[0];
                console.log(`✅ Received SMS from ${sms.sender}:`);
                console.log(`   Text: ${sms.text}`);
                console.log(`   Code: ${sms.code || 'N/A'}`);

                // Finish the order
                await client.finishOrder(order.id);
                console.log('✅ Order finished successfully!');
                return;
            }

            if (status.status === OrderStatus.TIMEOUT || status.status === OrderStatus.CANCELED) {
                console.log('⚠️  Order timed out or was canceled');
                return;
            }
        }

        // Timeout - cancel
        console.log('⏰ Timeout - canceling order...');
        await client.cancelOrder(order.id);
        console.log('✅ Order canceled, refund should be processed');

    } catch (error) {
        if (error instanceof NoNumbersError) {
            console.log('⚠️  No numbers available for this service/country/operator');
        } else {
            throw error;
        }
    }
}

main().catch(console.error);
