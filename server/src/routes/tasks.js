const router = require('express').Router();
const auth   = require('../middleware/auth');
const Task   = require('../models/Task');

// GET all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST create task
router.post('/', auth, async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PATCH update task
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true }
    ).populate('assignee', 'name email');
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task:deleted', { id: req.params.id });
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;