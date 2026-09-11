from pymongo import MongoClient
import sys

uri = "mongodb+srv://Smart-SDG-Framewrok:Rahul%40123@cluster0.3vdl5kq.mongodb.net/?appName=Cluster0"

try:
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(uri)
    
    # Select the database (it will be created automatically when data is inserted)
    db = client['Smart-SDG-Framework']
    
    # Select a collection
    collection = db['test_collection']
    
    # Insert a test document to "make" the database
    result = collection.insert_one({"status": "success", "message": "MongoDB is successfully created and connected!"})
    
    print(f"✅ Connected successfully! The database is now created. Test data inserted with ID: {result.inserted_id}")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)
