// test-routes.js
const express = require('express');
const app = express();
const messageSettingsRoutes = require('./routes/messageSettingsRoutes');

app.use('/api/message-settings', messageSettingsRoutes);

app.listen(5002, () => {
  console.log('✅ Test serveur sur port 5002');
  console.log('Testez: http://localhost:5002/api/message-settings/test');
});