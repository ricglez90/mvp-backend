require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware para parsear JSON
app.use(express.json());
app.use(cors());

// Endpoint que Supabase llamará cuando haya una actualización
app.post('/api/webhooks/supabase', async (req, res) => {
  try {
    const payload = req.body;

    // 1. Verificamos que sea un evento de la tabla orders
    if (payload.table !== 'orders') {
      return res.status(400).send('Evento ignorado');
    }

    const order = payload.record;
    const oldOrder = payload.old_record;

    // 2. Lógica de disparo: Solo enviar si el status cambió a 'paid'
    // Esto evita enviar correos duplicados si el registro se actualiza por otra razón
    if (order.status === 'paid' && (!oldOrder || oldOrder.status !== 'paid')) {
      
      const emailDestino = order.lead_email;
      
      // 3. Envío del correo usando Resend
      const { data, error } = await resend.emails.send({
        from: 'Clinica <onboarding@resend.dev>', // Correo por defecto de prueba en Resend
        to: emailDestino,
        subject: 'Descarga tu Guía Práctica de Intervención 📚',
        html: `
          <div style="font-family: sans-serif; color: #07002C; max-width: 600px; margin: auto;">
            <h2 style="color: #00abf3;">¡Gracias por tu compra!</h2>
            <p>Tu pago ha sido confirmado exitosamente.</p>
            <p>Haz clic en el botón de abajo para descargar tu material:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="URL_DE_TU_PDF_EN_SUPABASE" style="background-color: #89cb72; color: #07002C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Descargar Manual</a>
            </div>
            <p>Si tienes problemas, responde a este correo.</p>
          </div>
        `
      });

      if (error) {
        console.error('Error enviando correo:', error);
        return res.status(500).json({ error });
      }

      console.log(`Correo enviado exitosamente a ${emailDestino}. ID: ${data.id}`);
      return res.status(200).json({ message: 'Correo enviado' });
    }

    // Si el status no es paid, simplemente ignoramos
    return res.status(200).send('Orden no pagada, no se envió correo');

  } catch (error) {
    console.error('Error del servidor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});