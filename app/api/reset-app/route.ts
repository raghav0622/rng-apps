import { auth, firestore } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 💣 DANGER: RESET APP API
 * Deletes ALL Firestore collections and ALL Firebase Auth users.
 * 
 * ONLY WORKS IN DEVELOPMENT OR IF A SECRET IS PROVIDED.
 */
export async function POST(req: NextRequest) {
  // 1. Safety Guard: Check Environment
  const isDev = process.env.NODE_ENV === 'development';
  const secret = req.headers.get('x-reset-secret');
  const envSecret = process.env.APP_RESET_SECRET;

  if (!isDev && (!envSecret || secret !== envSecret)) {
    return NextResponse.json(
      { error: 'Forbidden: App reset is only allowed in development or with a valid secret.' },
      { status: 403 }
    );
  }

  try {
    console.log('🔥 Starting App Reset...');

    // --- 1. Delete All Firestore Data ---
    const db = firestore();
    const collections = await db.listCollections();
    
    console.log(`🧹 Deleting ${collections.length} root collections...`);
    
    for (const collection of collections) {
      // recursiveDelete is efficient for large collections and sub-collections
      await db.recursiveDelete(collection);
      console.log(`✅ Deleted collection: ${collection.id}`);
    }

    // --- 2. Delete All Auth Users ---
    const authAdmin = auth();
    let userCount = 0;

    async function deleteAllUsers(nextPageToken?: string) {
      const listUsersResult = await authAdmin.listUsers(1000, nextPageToken);
      const uids = listUsersResult.users.map((user) => user.uid);
      
      if (uids.length > 0) {
        await authAdmin.deleteUsers(uids);
        userCount += uids.length;
        console.log(`✅ Deleted batch of ${uids.length} users.`);
      }

      if (listUsersResult.pageToken) {
        await deleteAllUsers(listUsersResult.pageToken);
      }
    }

    console.log('👤 Deleting all Auth users...');
    await deleteAllUsers();

    console.log('✨ Reset Complete.');

    return NextResponse.json({
      success: true,
      message: `Successfully reset the app. Deleted ${collections.length} collections and ${userCount} users.`,
    });

  } catch (error: any) {
    console.error('❌ Reset Failed:', error);
    return NextResponse.json(
      { error: 'Reset failed', details: error.message },
      { status: 500 }
    );
  }
}
