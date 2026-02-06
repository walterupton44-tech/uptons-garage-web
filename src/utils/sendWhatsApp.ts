// utils/sendWhatsApp.ts
async function sendWhatsAppMessage(phone: string, appointment: any) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

  const confirmUrl = `http://localhost/agenda/confirmar?id=${appointment.id}`;
  const cancelUrl = `http://localhost/agenda/cancelar?id=${appointment.id}`;

  const message = `Hola ${appointment.clients?.name}, tu turno en Upton's Garage quedó agendado:
📅 Fecha: ${appointment.date}
⏰ Hora: ${appointment.time}
🚗 Vehículo: ${appointment.vehicles?.matricula}
🔧 Motivo: ${appointment.reason}

👉 Confirmar turno: ${confirmUrl}
❌ Cancelar turno: ${cancelUrl}`;

  await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  });
}

