const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Project = require('../models/Project');
const Task    = require('../models/Task');

// GET all projects for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    }).populate('owner', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST create project
router.post('/', auth, async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user.id });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner members', 'name email');
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PATCH update project
router.patch('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE project and all its tasks
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;