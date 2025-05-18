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
  // Se extrae el primer mensaje del payload
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  console.log("Mensaje recibido: ", JSON.stringify(message, null, 2));
  if (!message) return res.sendStatus(200);

  const from = message.from;
  const type = message.type;
  const textBody = message.text?.body?.trim();

  // 1) SALUDO INICIAL
  if (type === 'text' && (!userState[from] || /hola/i.test(textBody))) {
    userState[from] = { step: 'awaiting_selection' };
    await sendTemplateMessage(from);
    return res.sendStatus(200);
  }


  // 2) BOTÓN DE SELECCIÓN (audio/video)
  if (type === 'button' && message.button?.payload) {
    console.log("Button payload:", JSON.stringify(message.interactive, null, 2));

    let choice = message.button?.payload; // "video" o "audio"

    choice.includes("video") ? choice = "video" : choice = "audio";

    userState[from] = {
      step: 'awaiting_link',
      type: choice
    };

    console.log("Opcion elegida: ", choice)

    const response = `Perfecto, usare el formato de ${choice}. Ahora enviame el enlace correspondiente.`;

    await sendText(from, response);
    return res.sendStatus(200);
  }


  // 3) ESPERANDO ENLACE
  if (type === 'text' && userState[from]?.step === 'awaiting_link') {
    if (!isValidLink(textBody)) {
      await sendText(from, 'Ese enlace no es válido. Intenta con uno de TikTok, Instagram, YouTube...');
      return res.sendStatus(200);
    }

    // Se bloquean nuevos links y se avisa al usuario
    userState[from].step = 'processing';
    const mediaType = userState[from].type || 'video';
    await sendText(from, `⌛ Descargando ${mediaType}, un momento por favor...`);

    // Aqui irá la lógica real de descarga, por ahora se simula:
    setTimeout(async () => {
      await sendText(from, `✅ ¡Listo! Tu ${mediaType} está disponible (prueba).`);
      userState[from].step = 'awaiting_link';
    }, 5000);

    return res.sendStatus(200);
  }


  // 4) SI ESTÁ PROCESSING Y MANDA OTRO MENSAJE
  if (type === 'text' && userState[from]?.step === 'processing') {
    return sendText(from, '🕑 Aún procesando tu solicitud. Espera un momento.');
  }


  // 5) ENVÍO DIRECTO DE LINK (sin botones, después del primer flujo)
  if (type === 'text' && isValidLink(textBody)) {
    userState[from] = { step: 'processing', type: 'video' };
    await sendText(from, '⌛ Descargando video, espera un momento...');
    // Simulación
    setTimeout(async () => {
      await sendText(from, '✅ Aquí tu video (prueba)');
      userState[from].step = 'awaiting_link';
    }, 5000);
    return res.sendStatus(200);
  }


  // 6) CASO POR DEFECTO - GUÍA AL USUARIO
  await sendText(from, `Para comenzar, escribe "hola" o envíame un enlace válido`);
  res.sendStatus(200);

});

APP.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
