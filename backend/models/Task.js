const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  timestamp: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  due_date: Date,
  tags: [String],
  comments: [commentSchema],
  activity: [activitySchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

taskSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
