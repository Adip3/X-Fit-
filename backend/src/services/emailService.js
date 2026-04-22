import nodemailer from "nodemailer";

// Create a FRESH transporter each time (Gmail can drop idle connections)
function createTransporter() {
  const user = (process.env.SMTP_USER || process.env.SMTP_EMAIL || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "").trim();
  
  if (!user || !pass) {
    console.log("⚠️  SMTP not configured");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user, pass },
    // Gmail needs these
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getFrom() {
  const name = process.env.SMTP_FROM_NAME || "xsow Store";
  const email = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  return `"${name}" <${email}>`;
}

export async function verifySmtp() {
  try {
    const t = createTransporter();
    if (!t) return false;
    await t.verify();
    console.log("✅ SMTP connected:", (process.env.SMTP_USER || "").trim());
    return true;
  } catch (err) {
    console.error("❌ SMTP failed:", err.message);
    return false;
  }
}

// Send a single email — creates fresh connection each time
async function sendMail(to, subject, html) {
  const t = createTransporter();
  if (!t) {
    console.log("⚠️  Skipping email (SMTP not configured):", to);
    return false;
  }
  try {
    const info = await t.sendMail({ from: getFrom(), to, subject, html });
    console.log("📧 Sent to", to, "→", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email to", to, "failed:", err.message);
    return false;
  }
}

function emailTemplate(title, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#ff6452;padding:30px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px">xsow</h1>
    <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:13px">Premium Footwear</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#333;margin:0 0 20px;font-size:22px">${title}</h2>
    ${bodyHtml}
  </div>
  <div style="background:#1a1a1a;padding:25px;text-align:center">
    <p style="color:#999;margin:0;font-size:12px">&copy; ${new Date().getFullYear()} xsow. All rights reserved.</p>
  </div>
</div></body></html>`;
}

export async function sendWelcomeEmail(user) {
  const html = emailTemplate("Welcome to xsow! 👟", `
    <p style="color:#555;line-height:1.7">Hi <strong>${user.name}</strong>,</p>
    <p style="color:#555;line-height:1.7">Welcome to xsow! Browse our premium footwear and find your perfect pair.</p>
    <div style="text-align:center;margin:30px 0">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" style="background:#ff6452;color:#fff;padding:14px 40px;text-decoration:none;border-radius:12px;font-weight:600;display:inline-block">Shop Now</a>
    </div>
    <p style="color:#555">Happy shopping!<br><strong>The xsow Team</strong></p>
  `);
  return sendMail(user.email, "Welcome to xsow! 👟", html);
}

export async function sendCustomEmail(to, subject, message) {
  const html = emailTemplate(subject, `<div style="color:#555;line-height:1.8;white-space:pre-wrap">${message}</div>`);
  return sendMail(to, subject, html);
}

export async function sendOrderConfirmation(order) {
  const email = order.shippingAddress?.email;
  if (!email) return false;
  const itemsHtml = (order.items || []).map(i =>
    `<tr><td style="padding:10px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${i.subtotal?.toFixed(2)}</td></tr>`
  ).join("");
  const html = emailTemplate("Order Confirmed! 🎉", `
    <p style="color:#555">Hi <strong>${order.shippingAddress?.fullName}</strong>, your order <strong>${order.orderNumber}</strong> is confirmed!</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr style="background:#f8f8f8"><th style="padding:10px;text-align:left">Item</th><th style="padding:10px;text-align:center">Qty</th><th style="padding:10px;text-align:right">Price</th></tr>
      ${itemsHtml}
      <tr><td colspan="2" style="padding:12px;font-weight:700">Total</td><td style="padding:12px;text-align:right;font-weight:700;color:#ff6452">$${order.totalAmount?.toFixed(2)}</td></tr>
    </table>
    <div style="background:#f8f9fa;border-radius:12px;padding:15px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#666"><strong>Payment:</strong> ${order.paymentMethod || 'N/A'} — ${order.paymentStatus || 'pending'}</p>
      <p style="margin:5px 0 0;font-size:13px;color:#666"><strong>Ship to:</strong> ${order.shippingAddress?.address}, ${order.shippingAddress?.city}</p>
    </div>
  `);
  return sendMail(email, `Order Confirmed: ${order.orderNumber} 🎉`, html);
}

export async function sendOrderStatusUpdate(order) {
  const email = order.shippingAddress?.email;
  if (!email) return false;
  const emoji = { processing: "⚙️", shipped: "🚚", delivered: "✅", cancelled: "❌" }[order.status] || "📦";
  const html = emailTemplate(`Order ${order.status} ${emoji}`, `
    <p style="color:#555">Hi <strong>${order.shippingAddress?.fullName}</strong>, your order <strong>${order.orderNumber}</strong> is now:</p>
    <div style="text-align:center;margin:25px 0">
      <span style="background:${order.status === 'delivered' ? '#22c55e' : order.status === 'cancelled' ? '#ef4444' : '#ff6452'};color:#fff;padding:12px 30px;border-radius:25px;font-weight:700;display:inline-block;text-transform:uppercase">${emoji} ${order.status}</span>
    </div>
    ${order.paymentStatus ? `<p style="color:#555"><strong>Payment:</strong> ${order.paymentStatus}</p>` : ''}
    <p style="color:#555">Total: <strong>$${order.totalAmount?.toFixed(2)}</strong></p>
  `);
  return sendMail(email, `Order ${order.status}: ${order.orderNumber} ${emoji}`, html);
}

export async function notifySubscribersNewSale(sale, product) {
  let Subscriber;
  try {
    Subscriber = (await import("../models/Subscriber.js")).default;
  } catch (err) {
    console.error("❌ Cannot load Subscriber model:", err.message);
    return 0;
  }

  const subs = Subscriber.getAll();
  if (!subs.length) {
    console.log("📧 No subscribers to notify");
    return 0;
  }

  console.log(`📧 Notifying ${subs.length} subscriber(s) about sale: ${product.name} (${sale.discount}% off)...`);

  const html = emailTemplate("🔥 New Sale Alert!", `
    <p style="color:#555">Great news! New deal just dropped:</p>
    <div style="background:#fff5f5;border:2px solid #ff6452;border-radius:16px;padding:25px;margin:20px 0;text-align:center">
      <h3 style="color:#333;margin:0 0 8px">${product.name}</h3>
      <p style="margin:0"><span style="text-decoration:line-through;color:#999">$${product.price}</span> <span style="color:#ff6452;font-size:24px;font-weight:700;margin-left:10px">$${sale.salePrice}</span></p>
      <p style="background:#ff6452;color:#fff;display:inline-block;padding:5px 15px;border-radius:20px;font-weight:700;font-size:13px;margin:12px 0">${sale.discount}% OFF</p>
      ${sale.endsAt ? `<p style="color:#999;font-size:12px;margin:8px 0 0">Ends: ${new Date(sale.endsAt).toLocaleDateString()}</p>` : ''}
    </div>
    <div style="text-align:center;margin:25px 0">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/sales" style="background:#ff6452;color:#fff;padding:14px 40px;text-decoration:none;border-radius:12px;font-weight:600;display:inline-block">Shop Now</a>
    </div>
    <p style="color:#999;font-size:11px;margin-top:30px">You subscribed to xsow updates.</p>
  `);

  let sent = 0;
  for (const sub of subs) {
    const ok = await sendMail(sub.email, `🔥 ${sale.discount}% OFF ${product.name}!`, html);
    if (ok) sent++;
  }
  console.log(`📧 Sale notification complete: ${sent}/${subs.length} sent`);
  return sent;
}

// Send bulk order price quote response to customer
export async function sendBulkOrderResponse(bulkOrder) {
  if (!bulkOrder.customerEmail) return false;
  const itemRows = bulkOrder.items.filter(i => i.approved).map(i =>
    `<tr><td style="padding:8px;border:1px solid #eee">${i.name}</td><td style="padding:8px;border:1px solid #eee;text-align:center">${i.requestedQuantity}</td><td style="padding:8px;border:1px solid #eee;text-align:right">$${i.originalPrice}</td><td style="padding:8px;border:1px solid #eee;text-align:right;color:#e44d26;font-weight:bold">$${i.bulkPrice || i.originalPrice}</td></tr>`
  ).join("");
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#333">📦 Bulk Order Quote — ${bulkOrder.requestNumber}</h2>
      <p>Dear ${bulkOrder.customerName},</p>
      <p>Thank you for your wholesale inquiry. Here is our updated pricing for your bulk order:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f8f8f8"><th style="padding:8px;border:1px solid #eee;text-align:left">Product</th><th style="padding:8px;border:1px solid #eee">Qty</th><th style="padding:8px;border:1px solid #eee;text-align:right">Retail Price</th><th style="padding:8px;border:1px solid #eee;text-align:right">Bulk Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr style="background:#f0f0f0"><td colspan="3" style="padding:8px;border:1px solid #eee;font-weight:bold">Total Bulk Price</td><td style="padding:8px;border:1px solid #eee;text-align:right;font-weight:bold;color:#e44d26">$${bulkOrder.totalBulkPrice?.toFixed(2) || "—"}</td></tr></tfoot>
      </table>
      ${bulkOrder.adminNote ? `<p><strong>Note from admin:</strong> ${bulkOrder.adminNote}</p>` : ""}
      <p>This quote is valid for 7 days. To confirm your order, please reply to this email or visit our store.</p>
      <p style="margin-top:24px">— xsow Wholesale Team</p>
    </div>`;
  return sendMail(bulkOrder.customerEmail, `📦 Bulk Order Quote — ${bulkOrder.requestNumber}`, html);
}

// Notify subscribers about a new product
export async function notifySubscribersNewProduct(product) {
  const Subscriber = (await import("../models/Subscriber.js")).default;
  const subs = Subscriber.getAll();
  if (!subs.length) { console.log("📧 No subscribers to notify"); return 0; }
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#333">🆕 New Product Just Dropped!</h2>
      <div style="background:#f8f8f8;border-radius:12px;padding:20px;text-align:center;margin:16px 0">
        <h3 style="color:#e44d26;margin:0 0 8px">${product.name}</h3>
        <p style="color:#666;margin:4px 0">${product.category}${product.fabric ? " • " + product.fabric : ""}</p>
        <p style="font-size:24px;font-weight:bold;color:#333;margin:8px 0">$${product.price}</p>
        <p style="color:#666;font-size:14px">${product.description || ""}</p>
      </div>
      <p>Be the first to grab it before it sells out!</p>
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/product/${product.id}" style="display:inline-block;background:#e44d26;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px">Shop Now</a>
      <p style="margin-top:24px;color:#999;font-size:12px">— xsow Store</p>
    </div>`;
  let sent = 0;
  for (const sub of subs) {
    const ok = await sendMail(sub.email, `🆕 New: ${product.name} just dropped on xsow!`, html);
    if (ok) sent++;
  }
  console.log(`📧 New product notification: ${sent}/${subs.length} sent`);
  return sent;
}

export default { verifySmtp, sendWelcomeEmail, sendCustomEmail, sendOrderConfirmation, sendOrderStatusUpdate, notifySubscribersNewSale, sendBulkOrderResponse, notifySubscribersNewProduct };
