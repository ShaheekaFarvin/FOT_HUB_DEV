const express  = require('express');
const dotenv   = require('dotenv');
const cors     = require('cors');
const path     = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/elections',  require('./routes/elections'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/student',    require('./routes/student'));
app.use('/api/reg-config', require('./routes/regConfig'));
app.use('/api/ai-chat',    require('./routes/aiChat'));

app.get('/', (req, res) => res.json({ message: 'FOT Student Hub API v2.0 — RJT University' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
