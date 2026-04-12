const path   = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const { createServer } = require('http');
const { Server }       = require('socket.io');

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.set('io', io);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join:project',  (projectId) => socket.join(projectId));
  socket.on('leave:project', (projectId) => socket.leave(projectId));
  socket.on('disconnect',    () => console.log('Client disconnected:', socket.id));
});

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks',    require('./routes/tasks'));

app.get('/', (req, res) => res.json({ msg: 'DevBoard API is running' }));

httpServer.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);