import { db } from '@/db';
import { predictions } from '@/db/schema';

async function main() {
    const samplePredictions = [
        {
            transactionId: 1,
            categoryId: 2,
            confidence: 0.96,
            influentialTokens: ["starbucks", "coffee", "latte"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 2,
            categoryId: 3,
            confidence: 0.98,
            influentialTokens: ["shell", "gas", "fuel"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 3,
            categoryId: 4,
            confidence: 0.94,
            influentialTokens: ["amazon", "books", "purchase"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 4,
            categoryId: 1,
            confidence: 0.92,
            influentialTokens: ["whole", "foods", "groceries"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 5,
            categoryId: 6,
            confidence: 0.97,
            influentialTokens: ["netflix", "subscription", "monthly"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 6,
            categoryId: 7,
            confidence: 0.95,
            influentialTokens: ["uber", "ride", "downtown"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 7,
            categoryId: 5,
            confidence: 0.93,
            influentialTokens: ["electric", "bill", "monthly"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 8,
            categoryId: 8,
            confidence: 0.89,
            influentialTokens: ["cvs", "pharmacy", "prescription"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 9,
            categoryId: 2,
            confidence: 0.91,
            influentialTokens: ["chipotle", "grill", "lunch"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 10,
            categoryId: 4,
            confidence: 0.86,
            influentialTokens: ["target", "household", "items"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 11,
            categoryId: 3,
            confidence: 0.98,
            influentialTokens: ["shell", "gas", "fuel"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 12,
            categoryId: 6,
            confidence: 0.95,
            influentialTokens: ["spotify", "premium", "monthly"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 13,
            categoryId: 1,
            confidence: 0.88,
            influentialTokens: ["walmart", "supercenter", "groceries"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 14,
            categoryId: 2,
            confidence: 0.90,
            influentialTokens: ["panera", "bread", "breakfast"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 15,
            categoryId: 6,
            confidence: 0.93,
            influentialTokens: ["amc", "theatres", "movie"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 16,
            categoryId: 5,
            confidence: 0.91,
            influentialTokens: ["verizon", "wireless", "bill"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 17,
            categoryId: 1,
            confidence: 0.89,
            influentialTokens: ["trader", "joes", "groceries"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 18,
            categoryId: 7,
            confidence: 0.94,
            influentialTokens: ["lyft", "ride", "airport"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 19,
            categoryId: 8,
            confidence: 0.87,
            influentialTokens: ["walgreens", "health", "products"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        },
        {
            transactionId: 20,
            categoryId: 2,
            confidence: 0.92,
            influentialTokens: ["pizza", "hut", "dinner"],
            modelVersion: "v1.0",
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(predictions).values(samplePredictions);
    
    console.log('✅ Predictions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});