import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const currentTimestamp = new Date().toISOString();

    const sampleUsers = [
        {
            email: 'user1@averon.ai',
            name: 'Demo User 1',
            passwordHash: hashedPassword,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            email: 'user2@averon.ai',
            name: 'Demo User 2',
            passwordHash: hashedPassword,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});