const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// List tasks (with pagination & filters)
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10, assignee, status, priority, search } = req.query;
  const filter = {};
  if (assignee) filter.assignee = assignee;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) filter.title = { $regex: search, $options: 'i' };
  try {
    const tasks = await Task.find(filter)
      .populate('assignee', 'username')
      .populate('created_by', 'username')
      .sort({ updated_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const count = await Task.countDocuments(filter);
    res.json({ tasks, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, assignee, due_date, tags } = req.body;
    const task = new Task({
      title,
      description,
      status,
      priority,
      assignee,
      created_by: req.user.id,
      due_date,
      tags,
      activity: [{ user: req.user.id, action: 'created task' }],
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    updates.updated_at = Date.now();
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates, $push: { activity: { user: req.user.id, action: 'updated task' } } },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: { user: req.user.id, text },
          activity: { user: req.user.id, action: 'added comment' },
        },
        $set: { updated_at: Date.now() },
      },
      { new: true }
    ).populate('comments.user', 'username');
    res.json(task.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get activity log
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('activity.user', 'username');
    res.json(task.activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
