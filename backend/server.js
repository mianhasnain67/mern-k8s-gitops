const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-service:27017/merndb';

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/api/data', async (req, res) => {
  res.json({ message: "Hello from Cloud-Native Backend API!", database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" });
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB via ClusterIP'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
