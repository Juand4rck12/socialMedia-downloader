// Validar si el mensaje contiene un enlace soportado
export default function isValidLink(text) {
  const regex = /https?:\/\/(www\.)?(vt.tiktok\.com|instagram\.com|fb\.watch|youtube\.com|youtu\.be)\/\S*/;
  return regex.test(text);
}

