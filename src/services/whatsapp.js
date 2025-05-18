import axios from 'axios';
import { PHONE_ID, VERSION, WHATSAPP_TOKEN } from '../config/config.js';

/**
 * Envía un mensaje de texto simple.
 * @param {string} to Número destino (wa_id).
 * @param {string} message Mensaje
 */
export async function sendText(to, message) {
    try {
        await axios.post(
            `https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                text: {
                    body: message
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                },
            }
        );

        console.log("✅Mensaje enviado correctamente!")

    } catch (error) {
        console.log(`Error al enviar el mensaje ${error.message} || ${error.response?.data}`);
    }
}

// Responder mensaje (función de prueba)
export async function answerMessage({ version = VERSION, from, msg_body }) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/${version}/${PHONE_ID}/messages`,
            data: {
                messaging_product: 'whatsapp',
                to: from,
                text: { body: `Hola, recibí tu mensaje: "${msg_body}"` }
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
            }
        });

        console.log('Respuesta enviada');
    } catch (error) {
        console.log(`Error al enviar la respuesta: || ${error.response?.data}`);
    }
}

/**
 * Envía la plantilla de bienvenida con botones para escoger tipo de descarga
 * @param {string} to 
 */
export async function sendTemplateMessage(to) {
    try {
        await axios.post(
            `https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                type: "template",
                template: {
                    "name": "initial_gretting",
                    language: {
                        code: "es"
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`
                }
            }
        )

        console.log("✅Template message enviado correctamente.")

    } catch (error) {
        console.log(`Error al enviar el template message ${error} || ${error.response?.data}`);
    }
}
