const express = require('express')
const mongoose = require('mongoose');
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config();
require('./config/passport')
const passportLib = require('passport');
const response = require('./middleware/response');

const app = express();

app.use(helmet());
app.use(morgan('dev'))
app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean) || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(response);
app.use(express.json());
app.use(passportLib.initialize());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
.then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'))
app.use('/api/doctor', require('./routes/doctor'))
app.use('/api/patient', require('./routes/patient'))
app.use('/api/appointment', require('./routes/appointment'))
app.use('/api/payment', require('./routes/payment'))
app.use('/api/admin', require('./routes/admin'))
app.use("/api/ai", require("./routes/ai"))

app.get('/health', (req, res) => res.ok({ time: new Date().toISOString() }, 'OK'))


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));