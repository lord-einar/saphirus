import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Verificar si las credenciales de email están configuradas
const emailConfigured = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

let transporter = null;

if (emailConfigured) {
  // Configurar transporter de Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // Verificar configuración al iniciar
  transporter.verify((error, success) => {
    if (error) {
      console.error('⚠️  Error en configuración de email:', error.message);
      console.log('💡 Configura GMAIL_USER y GMAIL_APP_PASSWORD en el archivo .env');
    } else {
      console.log('✓ Servicio de email configurado correctamente');
    }
  });
} else {
  console.log('⚠️  Email no configurado. Configura GMAIL_USER y GMAIL_APP_PASSWORD en .env');
  console.log('💡 Las notificaciones por email estarán deshabilitadas');
}

// Enviar email de nuevo pedido al vendedor
export async function sendNewOrderEmail(orderData, recipientEmail) {
  if (!emailConfigured || !transporter) {
    console.log('⚠️  Email no enviado: servicio de email no configurado');
    return { success: false, error: 'Email service not configured' };
  }

  const { order, items } = orderData;

  // Construir HTML de productos
  const productsHTML = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.product_name}</strong><br>
        <small>${item.brand || 'Sin marca'}</small>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.price.toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.quantity * item.price).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .customer-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        table { width: 100%; border-collapse: collapse; background: white; margin: 15px 0; }
        th { background: #4F46E5; color: white; padding: 10px; text-align: left; }
        .total-row { background: #f0f0f0; font-weight: bold; font-size: 1.1em; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 Nuevo Pedido Recibido</h1>
          <p>Pedido #${order.id}</p>
        </div>

        <div class="content">
          <h2>Información del Cliente</h2>
          <div class="customer-info">
            <p><strong>Nombre:</strong> ${order.customer_name} ${order.customer_lastname}</p>
            <p><strong>Teléfono:</strong> ${order.customer_phone}</p>
            ${order.customer_notes ? `<p><strong>Notas:</strong> ${order.customer_notes}</p>` : ''}
            <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString('es-AR')}</p>
          </div>

          <h2>Productos Solicitados</h2>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productsHTML}
              <tr class="total-row">
                <td colspan="3" style="padding: 15px; text-align: right;">TOTAL:</td>
                <td style="padding: 15px; text-align: right;">$${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/pedidos/${order.id}" class="button">
              Ver Pedido en Dashboard
            </a>
          </div>
        </div>

        <div class="footer">
          <p>Este es un email automático del sistema Saphirus</p>
          <p>No respondas a este correo</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Sistema Saphirus" <${process.env.GMAIL_USER}>`,
    to: recipientEmail,
    subject: `🛒 Nuevo Pedido #${order.id} - ${order.customer_name} ${order.customer_lastname}`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email de pedido enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error al enviar email:', error);
    return { success: false, error: error.message };
  }
}

// Enviar email de confirmación al cliente (opcional)
export async function sendOrderConfirmationEmail(orderData, customerEmail) {
  if (!emailConfigured || !transporter) {
    console.log('⚠️  Email no enviado: servicio de email no configurado');
    return { success: false, error: 'Email service not configured' };
  }

  const { order, items } = orderData;

  const productsHTML = items.map(item => `
    <li style="margin: 10px 0;">
      <strong>${item.product_name}</strong> x${item.quantity} - $${(item.quantity * item.price).toFixed(2)}
    </li>
  `).join('');

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pedido Recibido</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${order.customer_name}</strong>,</p>
          <p>Hemos recibido tu pedido correctamente. Nos pondremos en contacto contigo pronto.</p>

          <h3>Resumen del pedido:</h3>
          <ul>${productsHTML}</ul>

          <p style="font-size: 1.2em;"><strong>Total: $${total.toFixed(2)}</strong></p>

          <p>Gracias por tu compra!</p>
        </div>
        <div class="footer">
          <p>Saphirus - Sistema de Ventas</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Saphirus" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `Pedido recibido - Saphirus`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email de confirmación enviado al cliente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Error al enviar email de confirmación:', error);
    return { success: false, error: error.message };
  }
}

export default transporter;
