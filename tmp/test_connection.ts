
import { prisma } from '../lib/prisma';

async function test() {
  try {
    console.log("Testing connection...");
    const count = await prisma.user.count();
    console.log("User count:", count);
    
    console.log("Testing notifications...");
    const notifications = await prisma.notification.findMany({ take: 1 });
    console.log("Notifications found:", notifications.length);
    
    process.exit(0);
  } catch (err) {
    console.error("Connection test failed:", err);
    process.exit(1);
  }
}

test();
