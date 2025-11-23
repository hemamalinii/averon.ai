import { db } from '@/db';
import { transactions } from '@/db/schema';

async function main() {
    const now = new Date();
    const currentTimestamp = now.toISOString();
    
    const getDaysAgo = (days: number): string => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const sampleTransactions = [
        {
            userId: 1,
            description: 'Starbucks Coffee - Morning Latte',
            amount: 5.75,
            merchantName: 'Starbucks',
            transactionDate: getDaysAgo(7),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Shell Gas Station - Fuel',
            amount: 45.20,
            merchantName: 'Shell',
            transactionDate: getDaysAgo(6),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Amazon.com - Books Purchase',
            amount: 29.99,
            merchantName: 'Amazon',
            transactionDate: getDaysAgo(6),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Whole Foods Market - Weekly Groceries',
            amount: 87.45,
            merchantName: 'Whole Foods',
            transactionDate: getDaysAgo(5),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Netflix Monthly Subscription',
            amount: 15.99,
            merchantName: 'Netflix',
            transactionDate: getDaysAgo(5),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Uber Ride to Downtown',
            amount: 18.50,
            merchantName: 'Uber',
            transactionDate: getDaysAgo(4),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Electric Company - Monthly Bill',
            amount: 125.00,
            merchantName: 'City Electric',
            transactionDate: getDaysAgo(4),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'CVS Pharmacy - Prescription',
            amount: 22.50,
            merchantName: 'CVS',
            transactionDate: getDaysAgo(3),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Chipotle Mexican Grill - Lunch',
            amount: 12.85,
            merchantName: 'Chipotle',
            transactionDate: getDaysAgo(3),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Target - Household Items',
            amount: 54.30,
            merchantName: 'Target',
            transactionDate: getDaysAgo(2),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Shell Gas Station - Fuel',
            amount: 42.10,
            merchantName: 'Shell',
            transactionDate: getDaysAgo(2),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Spotify Premium - Monthly',
            amount: 9.99,
            merchantName: 'Spotify',
            transactionDate: getDaysAgo(1),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Walmart Supercenter - Groceries',
            amount: 95.60,
            merchantName: 'Walmart',
            transactionDate: getDaysAgo(1),
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Panera Bread - Breakfast',
            amount: 8.75,
            merchantName: 'Panera Bread',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'AMC Theatres - Movie Tickets',
            amount: 24.00,
            merchantName: 'AMC Theatres',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Verizon Wireless - Phone Bill',
            amount: 85.00,
            merchantName: 'Verizon',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Trader Joe\'s - Groceries',
            amount: 67.80,
            merchantName: 'Trader Joe\'s',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Lyft Ride - Airport',
            amount: 35.50,
            merchantName: 'Lyft',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Walgreens - Health Products',
            amount: 18.90,
            merchantName: 'Walgreens',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 1,
            description: 'Pizza Hut - Dinner Delivery',
            amount: 28.45,
            merchantName: 'Pizza Hut',
            transactionDate: currentTimestamp,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(transactions).values(sampleTransactions);
    
    console.log('✅ Transactions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});