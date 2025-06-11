const express = require('express');
const cors = require('cors');
const app = express();
const cartRoutes = require('../routes/cart'); // <-- đường dẫn tới cart.js

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', cartRoutes);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
