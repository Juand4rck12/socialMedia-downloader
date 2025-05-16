import express from 'express';
import bodyParser from 'body-parser';
import 'dotenv/config';
import { answerMessage } from './src/services/whatsapp.js';

const APP = express();
const PORT = 3000;
// Estructura temporal en mmemoria, objeto JS tipo userState
const userState = {}; // clave: número de teléfono, valor: estado actual


APP.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});


APP.use(bodyParser.json());

// Ruta de verificación del webhook (GET)
APP.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verificado');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
})

// Ruta que recibe los mensajes (POST)
APP.post('/webhook', async (req, res) => {
  console.log("📥 Webhook POST recibido");
  console.log(JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.text) {
      // const version = value.metadata.version;
      const phone_number_id = value.metadata.phone_number_id;
      const from = message.from;
      const msg_body = message.text.body;

      console.log(`Mensaje recibido de ${from}: ${msg_body}`);

      await answerMessage({ phone_number_id, from, msg_body});
    }
  }

  res.sendStatus(200);
});

APP.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
