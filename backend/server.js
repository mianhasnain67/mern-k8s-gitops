const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-service:27017/merndb';
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  status: { type: String, enum: TASK_STATUSES, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch tasks.' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.name === 'ValidationError' ? error.message : 'Unable to create task.' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json(task);
  } catch (error) {
    const statusCode = error.name === 'CastError' ? 400 : 422;
    res.status(statusCode).json({ message: error.name === 'ValidationError' ? error.message : 'Unable to update task.' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.status(204).end();
  } catch (error) {
    res.status(400).json({ message: 'Unable to delete task.' });
  }
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB via ClusterIP'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
