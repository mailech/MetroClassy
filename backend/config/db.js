import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://subha1111raj_db_user:OG2eIYqmRSPXzsxz@metroclassy.imxr1xq.mongodb.net/MetroClassy?appName=MetroClassy');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
