import { db } from '@/db';
import { feedback } from '@/db/schema';

async function main() {
    const sampleFeedback = [
        {
            transactionId: 3,
            predictionId: 3,
            originalCategoryId: 4,
            correctedCategoryId: 6,
            userId: 1,
            notes: 'Books should be categorized as entertainment',
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 10,
            predictionId: 10,
            originalCategoryId: 4,
            correctedCategoryId: 1,
            userId: 1,
            notes: 'Household cleaning supplies should be groceries',
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 14,
            predictionId: 14,
            originalCategoryId: 2,
            correctedCategoryId: 1,
            userId: 1,
            notes: 'Breakfast items purchased for home should be groceries',
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 12,
            predictionId: 12,
            originalCategoryId: 6,
            correctedCategoryId: 5,
            userId: 1,
            notes: 'Monthly subscriptions should be bills',
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 19,
            predictionId: 19,
            originalCategoryId: 8,
            correctedCategoryId: 1,
            userId: 1,
            notes: 'Vitamins and health products purchased as regular items',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(feedback).values(sampleFeedback);
    
    console.log('✅ Feedback seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});