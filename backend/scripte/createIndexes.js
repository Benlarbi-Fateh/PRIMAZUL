const mongoose = require("mongoose");
require("dotenv").config();

const indexPlan = {
  conversations: [
    { key: { participants: 1, updatedAt: -1 }, options: { name: "participants_updatedAt" } },
    { key: { "deletedBy.userId": 1 }, options: { name: "deletedBy_user" } },
    { key: { "archivedBy.userId": 1 }, options: { name: "archivedBy_user" } },
    { key: { isGroup: 1, groupType: 1 }, options: { name: "group_type" } },
  ],
  messages: [
    { key: { conversationId: 1, createdAt: -1 }, options: { name: "conversation_createdAt_desc" } },
    { key: { conversationId: 1, createdAt: 1 }, options: { name: "conversation_createdAt_asc" } },
    { key: { conversationId: 1, deletedFor: 1, createdAt: -1 }, options: { name: "visible_messages" } },
    { key: { conversationId: 1, status: 1, sender: 1 }, options: { name: "message_status_sender" } },
    { key: { "callDetails.callId": 1 }, options: { name: "callDetails_callId", sparse: true } },
    { key: { "storyReply.statusId": 1 }, options: { name: "storyReply_statusId", sparse: true } },
    { key: { isScheduled: 1, isSent: 1, scheduledFor: 1 }, options: { name: "scheduled_messages" } },
  ],
  users: [
    { key: { email: 1 }, options: { name: "email_unique", unique: true } },
    { key: { username: 1 }, options: { name: "username_unique_sparse", unique: true, sparse: true } },
    { key: { name: "text" }, options: { name: "name_text" } },
    { key: { isOnline: 1, lastSeen: -1 }, options: { name: "presence" } },
  ],
  invitations: [
    { key: { receiver: 1, status: 1, createdAt: -1 }, options: { name: "receiver_status_createdAt" } },
    { key: { sender: 1, status: 1, createdAt: -1 }, options: { name: "sender_status_createdAt" } },
    { key: { sender: 1, receiver: 1, status: 1 }, options: { name: "sender_receiver_status" } },
  ],
  contacts: [
    { key: { owner: 1, addedAt: -1 }, options: { name: "owner_addedAt" } },
    { key: { owner: 1, contact: 1 }, options: { name: "owner_contact" } },
    { key: { owner: 1, conversation: 1 }, options: { name: "owner_conversation" } },
    { key: { owner: 1, isFavorite: -1, addedAt: -1 }, options: { name: "owner_favorites" } },
  ],
  statuses: [
    { key: { userId: 1, createdAt: -1 }, options: { name: "user_createdAt" } },
    { key: { expiresAt: 1 }, options: { name: "expiresAt_ttl", expireAfterSeconds: 0 } },
    { key: { "views.userId": 1 }, options: { name: "views_user" } },
  ],
  calls: [
    { key: { conversationId: 1, status: 1, createdAt: -1 }, options: { name: "conversation_status_createdAt" } },
    { key: { "participants.userId": 1, status: 1 }, options: { name: "participant_status" } },
    { key: { caller: 1, createdAt: -1 }, options: { name: "caller_createdAt" } },
  ],
  tasks: [
    { key: { conversationId: 1, status: 1 }, options: { name: "conversation_status" } },
    { key: { conversationId: 1, projectId: 1 }, options: { name: "conversation_project" } },
    { key: { conversationId: 1, dueDate: 1 }, options: { name: "conversation_dueDate" } },
    { key: { assignees: 1, status: 1 }, options: { name: "assignees_status" } },
  ],
  personaltasks: [
    { key: { userId: 1, listId: 1, order: 1 }, options: { name: "user_list_order" } },
    { key: { userId: 1, completed: 1 }, options: { name: "user_completed" } },
    { key: { userId: 1, dueDate: 1 }, options: { name: "user_dueDate" } },
    { key: { userId: 1, isStarred: 1 }, options: { name: "user_starred" } },
  ],
  personaltasklists: [
    { key: { userId: 1, order: 1 }, options: { name: "user_order" } },
  ],
  blockedusers: [
    { key: { userId: 1, blockedUserId: 1 }, options: { name: "user_blocked_unique", unique: true } },
    { key: { blockedUserId: 1, userId: 1 }, options: { name: "blocked_user_lookup" } },
  ],
  projects: [
    { key: { conversationId: 1, createdAt: -1 }, options: { name: "conversation_createdAt" } },
  ],
};

function isExistingIndexError(error) {
  return error?.code === 85 || error?.code === 86 || error?.codeName === "IndexOptionsConflict";
}

async function createIndex(collectionName, spec) {
  const collection = mongoose.connection.collection(collectionName);

  try {
    await collection.createIndex(spec.key, spec.options);
    console.log(`  OK ${spec.options.name}`);
    return { created: 1, skipped: 0 };
  } catch (error) {
    if (isExistingIndexError(error)) {
      console.log(`  SKIP ${spec.options.name} (${error.codeName || error.code})`);
      return { created: 0, skipped: 1 };
    }
    throw error;
  }
}

async function createIndexes() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI non definie dans .env");
  }

  console.log("Connexion a MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connecte. Creation des indexes...");

  let created = 0;
  let skipped = 0;

  for (const [collectionName, specs] of Object.entries(indexPlan)) {
    console.log(`\n${collectionName}`);

    for (const spec of specs) {
      const result = await createIndex(collectionName, spec);
      created += result.created;
      skipped += result.skipped;
    }
  }

  console.log("\nResume:");
  console.log(`  Indexes crees/verifies: ${created}`);
  console.log(`  Indexes deja presents ou en conflit compatible: ${skipped}`);

  for (const collectionName of Object.keys(indexPlan)) {
    const indexes = await mongoose.connection.collection(collectionName).indexes();
    console.log(`  ${collectionName}: ${indexes.length} indexes`);
  }
}

createIndexes()
  .catch((error) => {
    console.error("Erreur creation indexes:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("\nConnexion MongoDB fermee");
    }
  });
