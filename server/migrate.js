const { MongoClient } = require('mongodb');

const localUri = "mongodb://127.0.0.1:27017/edusphere";
const atlasUri = "mongodb+srv://melbinsabu600_db_user:melbin2004@cluster0.8otpox9.mongodb.net/edusphere?retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
    console.log("Starting Migration...");
    
    let localClient, atlasClient;
    try {
        console.log("Connecting to local database...");
        localClient = await MongoClient.connect(localUri);
        const localDb = localClient.db("edusphere");
        console.log("Connected to local DB.");

        console.log("Connecting to Atlas database...");
        atlasClient = await MongoClient.connect(atlasUri);
        const atlasDb = atlasClient.db("edusphere");
        console.log("Connected to Atlas DB.");

        // Get all collections from local
        const collections = await localDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections locally.`);

        for (const collInfo of collections) {
            const collectionName = collInfo.name;
            console.log(`\n--- Migrating collection: ${collectionName} ---`);
            
            const localCollection = localDb.collection(collectionName);
            const atlasCollection = atlasDb.collection(collectionName);

            // Fetch all documents from local
            const documents = await localCollection.find({}).toArray();
            console.log(`Read ${documents.length} documents from local collection '${collectionName}'.`);

            if (documents.length > 0) {
                // Clear the Atlas collection first (optional, but good for a fresh migration)
                await atlasCollection.deleteMany({});
                console.log(`Cleared existing data in Atlas collection '${collectionName}'.`);

                // Insert all documents into Atlas
                await atlasCollection.insertMany(documents);
                console.log(`Successfully migrated ${documents.length} documents to Atlas.`);
            } else {
                console.log(`No documents to migrate for '${collectionName}'.`);
            }
        }

        console.log("\n✅ Migration completed successfully!");
    } catch (error) {
        console.error("Error during migration:", error);
    } finally {
        if (localClient) await localClient.close();
        if (atlasClient) await atlasClient.close();
        process.exit();
    }
}

migrate();
