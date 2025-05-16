import axios from 'axios';

const VERSION = "v22.0";

export async function answerMessage({ version = VERSION, phone_number_id, from, msg_body }) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/${version}/${phone_number_id}/messages`,
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
        console.log('Error al enviar la respuesta:', error.response?.data || error.message);
    }
}

export async function sendTemplateMessage(to) {
    try {
        await axios.post(
            `https://graph.facebook.com/${VERSION}/${phone_number_id}/messages`,
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
        console.log(`Error al enviar el template message ${error}`);
    }
}
