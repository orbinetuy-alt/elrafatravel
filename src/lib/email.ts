import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function enviarEmailCliente(params: {
  to: string
  nombre: string
  paseo: string
  fecha: string
  hora: string
  personas: number
}) {
  const { to, nombre, paseo, fecha, hora, personas } = params

  await transporter.sendMail({
    from: `El Rafa Travel <${process.env.GMAIL_USER}>`,
    to,
    subject: '✅ Solicitud de reserva recibida — El Rafa Travel',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f5f0e8;border-radius:12px;">
        <h2 style="color:#1a3a2f;margin-bottom:4px;">¡Hola, ${nombre}!</h2>
        <p style="color:#555;">Tu solicitud de reserva fue recibida correctamente. Te contactaremos pronto para confirmarla.</p>

        <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0d8cc;">
          <h3 style="color:#1a3a2f;margin-top:0;">Detalle de tu solicitud</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Paseo</td><td style="font-weight:bold;color:#1a3a2f;">${paseo}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Fecha</td><td style="font-weight:bold;color:#1a3a2f;">${fecha}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Horario</td><td style="font-weight:bold;color:#1a3a2f;">${hora}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Personas</td><td style="font-weight:bold;color:#1a3a2f;">${personas}</td></tr>
          </table>
        </div>

        <p style="color:#888;font-size:13px;">Si tenés alguna pregunta, respondé a este correo o contactanos directamente.</p>
        <p style="color:#1a3a2f;font-weight:bold;">El Rafa Travel — Lisboa, Portugal 🇵🇹</p>
      </div>
    `,
  })
}

export async function enviarEmailAdmin(params: {
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string
  paseo: string
  fecha: string
  hora: string
  personas: number
  notas?: string
}) {
  const { clienteNombre, clienteEmail, clienteTelefono, paseo, fecha, hora, personas, notas } = params

  await transporter.sendMail({
    from: `El Rafa Travel <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `🔔 Nueva solicitud de reserva — ${paseo}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f5f0e8;border-radius:12px;">
        <h2 style="color:#1a3a2f;">Nueva solicitud de reserva</h2>

        <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0d8cc;">
          <h3 style="color:#1a3a2f;margin-top:0;">Datos de la reserva</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Paseo</td><td style="font-weight:bold;color:#1a3a2f;">${paseo}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Fecha</td><td style="font-weight:bold;color:#1a3a2f;">${fecha}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Horario</td><td style="font-weight:bold;color:#1a3a2f;">${hora}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Personas</td><td style="font-weight:bold;color:#1a3a2f;">${personas}</td></tr>
          </table>

          <h3 style="color:#1a3a2f;margin-top:16px;">Cliente</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Nombre</td><td style="font-weight:bold;color:#1a3a2f;">${clienteNombre}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Email</td><td style="font-weight:bold;color:#1a3a2f;">${clienteEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Teléfono</td><td style="font-weight:bold;color:#1a3a2f;">${clienteTelefono}</td></tr>
            ${notas ? `<tr><td style="padding:6px 0;color:#888;font-size:14px;">Notas</td><td style="color:#1a3a2f;">${notas}</td></tr>` : ''}
          </table>
        </div>

        <p style="color:#888;font-size:13px;">Ingresá al panel de administración para gestionar esta solicitud.</p>
      </div>
    `,
  })
}

export async function enviarEmailConfirmacion(params: {
  to: string
  nombre: string
  paseo: string
  fecha: string
  hora: string
  personas: number
  duracion: string
  precioTotal: number
  precioSenia: number
  stripeUrl: string
}) {
  const { to, nombre, paseo, fecha, hora, personas, duracion, precioTotal, precioSenia, stripeUrl } = params

  await transporter.sendMail({
    from: `El Rafa Travel <${process.env.GMAIL_USER}>`,
    to,
    subject: '🎉 ¡Tu reserva fue confirmada! — El Rafa Travel',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f5f0e8;border-radius:12px;">
        <h2 style="color:#1a3a2f;margin-bottom:4px;">¡Hola, ${nombre}! 🎉</h2>
        <p style="color:#555;">¡Buenas noticias! Tu reserva fue <strong style="color:#1a3a2f;">confirmada</strong>. Para asegurar tu lugar, te pedimos que abones una seña del 50% del costo total.</p>

        <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0d8cc;">
          <h3 style="color:#1a3a2f;margin-top:0;">Detalle de tu reserva</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Paseo</td><td style="font-weight:bold;color:#1a3a2f;">${paseo}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Fecha</td><td style="font-weight:bold;color:#1a3a2f;">${fecha}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Horario</td><td style="font-weight:bold;color:#1a3a2f;">${hora}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Duración</td><td style="font-weight:bold;color:#1a3a2f;">${duracion}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Personas</td><td style="font-weight:bold;color:#1a3a2f;">${personas}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:14px;">Precio total</td><td style="font-weight:bold;color:#1a3a2f;">€${precioTotal.toFixed(2)}</td></tr>
          </table>
        </div>

        <div style="background:#1a3a2f;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:white;margin:0 0 4px 0;font-size:14px;">Seña a abonar ahora (50%)</p>
          <p style="color:#c8a84b;font-size:28px;font-weight:bold;margin:0 0 16px 0;">€${precioSenia.toFixed(2)}</p>
          <a href="${stripeUrl}" style="display:inline-block;background:#c8a84b;color:white;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">
            Pagar seña ahora →
          </a>
          <p style="color:#ffffff80;font-size:11px;margin:12px 0 0 0;">El resto (€${precioSenia.toFixed(2)}) se abona al finalizar el paseo.</p>
        </div>

        <p style="color:#888;font-size:13px;">Si tenés alguna pregunta, respondé a este correo o contactanos directamente.</p>
        <p style="color:#1a3a2f;font-weight:bold;">El Rafa Travel — Lisboa, Portugal 🇵🇹</p>
      </div>
    `,
  })
}

export async function enviarEmailRechazo(params: {
  to: string
  nombre: string
  paseo: string
  fecha: string
  motivo: string
}) {
  const { to, nombre, paseo, fecha, motivo } = params

  await transporter.sendMail({
    from: `El Rafa Travel <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Actualización sobre tu solicitud — El Rafa Travel',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f5f0e8;border-radius:12px;">
        <h2 style="color:#1a3a2f;margin-bottom:4px;">Hola, ${nombre}</h2>
        <p style="color:#555;">Lamentablemente no podemos confirmar tu solicitud de reserva para el paseo <strong>${paseo}</strong> el día <strong>${fecha}</strong>.</p>

        <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0d8cc;">
          <h3 style="color:#1a3a2f;margin-top:0;">Motivo</h3>
          <p style="color:#555;margin:0;">${motivo}</p>
        </div>

        <p style="color:#555;">Si querés, podés intentar reservar para otra fecha disponible desde nuestra web.</p>
        <p style="color:#888;font-size:13px;">Disculpá los inconvenientes. ¡Esperamos verte pronto en Lisboa!</p>
        <p style="color:#1a3a2f;font-weight:bold;">El Rafa Travel — Lisboa, Portugal 🇵🇹</p>
      </div>
    `,
  })
}

export async function enviarEmailPagoFinal(params: {
  to: string
  nombre: string
  paseo: string
  fecha: string
  montoPendiente: number
  stripeUrl: string
}) {
  const { to, nombre, paseo, fecha, montoPendiente, stripeUrl } = params

  await transporter.sendMail({
    from: `El Rafa Travel <${process.env.GMAIL_USER}>`,
    to,
    subject: '💳 Pago final de tu paseo — El Rafa Travel',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f5f0e8;border-radius:12px;">
        <h2 style="color:#1a3a2f;margin-bottom:4px;">¡Hola, ${nombre}! Esperamos que hayas disfrutado el paseo 🛺</h2>
        <p style="color:#555;">Fue un placer acompañarte en <strong>${paseo}</strong> el <strong>${fecha}</strong>. Quedó pendiente el pago del 50% restante.</p>

        <div style="background:#1a3a2f;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:white;margin:0 0 4px 0;font-size:14px;">Total pendiente</p>
          <p style="color:#c8a84b;font-size:28px;font-weight:bold;margin:0 0 16px 0;">€${montoPendiente.toFixed(2)}</p>
          <a href="${stripeUrl}" style="display:inline-block;background:#c8a84b;color:white;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">
            Completar pago →
          </a>
        </div>

        <p style="color:#888;font-size:13px;">¡Gracias por elegirnos! Esperamos verte de nuevo en Lisboa.</p>
        <p style="color:#1a3a2f;font-weight:bold;">El Rafa Travel — Lisboa, Portugal 🇵🇹</p>
      </div>
    `,
  })
}

