import { db } from '@/db';
import { categories } from '@/db/schema';

async function main() {
    const sampleCategories = [
        {
            name: 'Groceries',
            description: 'Supermarket and grocery purchases',
            colorHex: '#4CAF50',
            icon: 'shopping-cart',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Dining',
            description: 'Restaurants, cafes, and food delivery',
            colorHex: '#FF5722',
            icon: 'restaurant',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Fuel',
            description: 'Gas stations and fuel purchases',
            colorHex: '#9E9E9E',
            icon: 'local-gas-station',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Shopping',
            description: 'Retail and online shopping',
            colorHex: '#E91E63',
            icon: 'shopping-bag',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Bills',
            description: 'Utilities, subscriptions, and regular bills',
            colorHex: '#2196F3',
            icon: 'receipt',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Entertainment',
            description: 'Movies, streaming, and entertainment',
            colorHex: '#9C27B0',
            icon: 'movie',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Transport',
            description: 'Rideshare, public transit, and transportation',
            colorHex: '#FF9800',
            icon: 'directions-car',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Healthcare',
            description: 'Medical, pharmacy, and health expenses',
            colorHex: '#00BCD4',
            icon: 'local-hospital',
            userId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Other',
            description: 'Miscellaneous and uncategorized expenses',
            colorHex: '#607D8B',
            icon: 'more-horiz',
            userId: null,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(categories).values(sampleCategories);
    
    console.log('✅ Categories seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});