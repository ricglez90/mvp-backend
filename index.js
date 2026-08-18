require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(cors());

app.post('/api/webhooks/supabase', async (req, res) => {
  try {
    const payload = req.body;

    // ==========================================
    // FLUJO 1: ENTREGA DEL MANUAL GRATUITO
    // ==========================================
    if (payload.table === 'leads' && payload.type === 'INSERT') {
      const newLead = payload.record;
      const emailDestino = newLead.email;
      const nombreDestino = newLead.name || 'ahí';

      // 🛑 INSERTA AQUÍ TUS DOS URLS DEL BUCKET PÚBLICO
      const urlPdfGratuitoColor = "https://wsihilmvejerdjrhuaou.supabase.co/storage/v1/object/public/free-manuals/manual_001_color_lq.pdf";
      const urlPdfGratuitoBN = "https://wsihilmvejerdjrhuaou.supabase.co/storage/v1/object/public/free-manuals/manual_001_bn_lq.pdf";

      const { data, error } = await resend.emails.send({
        from: 'Beguka <manuals@beguka.dev>', 
        to: emailDestino,
        subject: 'Aquí tienes tu material gratuito 🎁',
        html: `
          <div style="font-family: sans-serif; color: #07002C; max-width: 600px; margin: auto;">
            <h2 style="color: #00abf3;">¡Hola ${nombreDestino}!</h2>
            <p>Gracias por tu interés. Como lo prometimos, aquí tienes tu material gratuito. Hemos preparado dos versiones para tu comodidad:</p>
            
            <div style="text-align: center; margin: 30px 0; display: flex; flex-direction: column; gap: 15px;">
              <a href="${urlPdfGratuitoColor}" style="background-color: #89cb72; color: #07002C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                📱 Descargar Versión Digital (Color)
              </a>
              
              <a href="${urlPdfGratuitoBN}" style="background-color: #f8bb4a; color: #07002C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                🖨️ Descargar Versión para Imprimir (B/N)
              </a>
            </div>
            
            <p>No olvides revisar nuestra guía completa para tener las herramientas de intervención necesarias.</p>
          </div>
        `
      });

      if (error) {
        console.error('Error enviando correo gratuito:', error);
        return res.status(500).json({ error });
      }
      return res.status(200).json({ message: 'Correo gratuito enviado con 2 versiones' });
    }

    // ==========================================
    // FLUJO 2: ENTREGA DEL MANUAL DE PAGA (FUTURO)
    // ==========================================
    if (payload.table === 'orders') {
      const order = payload.record;
      const oldOrder = payload.old_record;

      if (order.status === 'paid' && (!oldOrder || oldOrder.status !== 'paid')) {
        const emailDestino = order.lead_email;
        
        // 🛑 En el futuro, aquí pondremos las URLs firmadas de tus manuales de paga
        const urlPdfPagaColor = "#"; 
        const urlPdfPagaBN = "#";

        const { data, error } = await resend.emails.send({
          from: 'Beguka <manuals@beguka.dev>',
          to: emailDestino,
          subject: 'Descarga tu Guía Práctica Completa 📚',
          html: `
            <div style="font-family: sans-serif; color: #07002C; max-width: 600px; margin: auto;">
              <h2 style="color: #00abf3;">¡Gracias por tu compra!</h2>
              <p>Tu pago ha sido confirmado. Aquí tienes tu guía completa lista para usarse:</p>
              
              <div style="text-align: center; margin: 30px 0; display: flex; flex-direction: column; gap: 15px;">
                <a href="${urlPdfPagaColor}" style="background-color: #00abf3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  📱 Descargar Guía Digital (Color)
                </a>
                
                <a href="${urlPdfPagaBN}" style="background-color: #f8bb4a; color: #07002C; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  🖨️ Descargar Guía para Imprimir (B/N)
                </a>
              </div>
            </div>
          `
        });

        if (error) return res.status(500).json({ error });
        return res.status(200).json({ message: 'Correo de paga enviado con 2 versiones' });
      }
    }

    return res.status(200).send('Evento procesado sin envío');

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en el puerto ${PORT}`));