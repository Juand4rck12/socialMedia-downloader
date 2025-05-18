import express from 'express';
import bodyParser from 'body-parser';

import { PORT, VERIFY_TOKEN } from './src/config/config.js';
import isValidLink from './src/utils/validator.js';
import { sendText, sendTemplateMessage } from './src/services/whatsapp.js';

const APP = express();
APP.use(bodyParser.json());

// Estructura temporal en memoria, objeto JS tipo userState
const userState = {}; // clave: número de teléfono, valor: estado actual


// Saltar advertencia de pagina de ngrok para 
// que meta reciba correctamente el webhook
APP.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});


// Ruta de verificación del webhook (GET)
APP.get('/webhook', (req, res) => {
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

/**
 * POST /webhook - Recibe eventos de WhatsApp
 */
APP.post("/webhook", async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const phoneNumber = message?.from;
  const type = message?.type;
  console.log(JSON.stringify(req.body, null, 2));


  if (!message) return res.sendStatus(200); // no hay mensaje

  // 🔸 Caso: texto normal
  if (type === "text") {
    const body = message.text.body;

    // Saludo inicial
    if (!userState[phoneNumber] || body.toLowerCase().includes("hola")) {
      userState[phoneNumber] = { step: "awaiting_selection" };
      await sendTemplateMessage(phoneNumber);
      return res.sendStatus(200);
    }

    // Esperando enlace
    if (userState[phoneNumber]?.step === "awaiting_link") {
      if (!isValidLink(body)) {
        await sendText(phoneNumber, "Ese enlace no es válido. Asegúrate de que sea de TikTok, Instagram, YouTube, etc.");
        return res.sendStatus(200);
      }

      userState[phoneNumber].step = "processing";
      await sendText(phoneNumber, "⏳ Descargando contenido, espera por favor...");

      setTimeout(async () => {
        await sendText(phoneNumber, "✅ ¡Listo! Aquí tienes tu descarga. (esto es solo una prueba)");
        userState[phoneNumber].step = "awaiting_link";
      }, 5000);

      return res.sendStatus(200);
    }

    // Si está procesando pero manda otro mensaje
    if (userState[phoneNumber]?.step === "processing") {
      await sendText(phoneNumber, "⏳ Todavía estoy procesando tu solicitud anterior. Por favor espera...");
      return res.sendStatus(200);
    }

    // Si ya tiene historial y manda un link sin botón → por defecto video
    if (isValidLink(body)) {
      userState[phoneNumber] = {
        step: "processing",
        type: "video"
      };

      await sendText(phoneNumber, "⏳ Descargando contenido en video, espera por favor...");

      setTimeout(async () => {
        await sendText(phoneNumber, "✅ ¡Listo! Aquí tienes tu descarga en video. (esto es solo una prueba)");
        userState[phoneNumber].step = "awaiting_link";
      }, 5000);

      return res.sendStatus(200);
    }

    // Por defecto: repetir saludo
    await sendText(phoneNumber, "Hola, puedes escribirme 'hola' para empezar o envíame un enlace válido.");
    return res.sendStatus(200);
  }

  // 🔸 Caso: botón presionado
  if (type === "interactive" && message.interactive.type === "button_reply") {
    const buttonId = message.interactive.button_reply.id;

    // Guardamos el tipo (audio/video) y pasamos a estado esperando link
    userState[phoneNumber] = {
      step: "awaiting_link",
      type: buttonId
    };

    await sendText(phoneNumber, `Perfecto. Ahora envíame el enlace del ${buttonId}.`);
    return res.sendStatus(200);
  }

  return res.sendStatus(200);
});

APP.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
