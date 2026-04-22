import Order from "../models/Order.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const ESEWA_SECRET = "8gBm/:&EnhH.1/q";
const PAYMENT_METHODS = {
  cod: { name: "Cash on Delivery" },
  esewa: { name: "eSewa" },
  khalti: { name: "Khalti" },
  card: { name: "Credit/Debit Card" },
};

function genTxnId() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
}

// ═══ API ENDPOINTS ═══

export const initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || !method) return res.status(400).json({ success: false, error: "orderId and method required" });
    const order = Order.getById(orderId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    if (!PAYMENT_METHODS[method]) return res.status(400).json({ success: false, error: "Invalid payment method" });
    if (method === "cod") {
      Order.update(orderId, { paymentMethod: "cod", paymentStatus: "pending" });
      return res.json({ success: true, data: { method: "cod", status: "pending" } });
    }
    const txnId = genTxnId();
    const amount = Math.round(order.totalAmount * 100) / 100;
    const backend = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    Order.update(orderId, { paymentMethod: method, paymentStatus: "processing", paymentId: txnId, paymentAmount: amount.toString() });
    const paymentUrl = `${backend}/pay/${method}?orderId=${orderId}&txnId=${txnId}&amount=${amount}&successUrl=${encodeURIComponent(frontend + "/payment/success")}&failureUrl=${encodeURIComponent(frontend + "/payment/failure")}`;
    res.json({ success: true, data: { method, paymentId: txnId, paymentUrl, amount, status: "initiated" } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const verifyPayment = async (req, res) => {
  try {
    const { orderId, method, transactionCode, status } = req.body;
    if (!orderId) return res.status(400).json({ success: false, error: "orderId required" });
    const order = Order.getById(orderId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    const isSuccess = status === "COMPLETE" || status === "success";
    const ps = isSuccess ? "paid" : "failed";
    Order.update(orderId, {
      paymentStatus: ps, paymentVerifiedAt: new Date().toISOString(), transactionCode: transactionCode || null,
      timeline: [...(order.timeline || []), { status: isSuccess ? "payment_confirmed" : "payment_failed", date: new Date().toISOString(), note: `Payment ${isSuccess ? "confirmed" : "failed"} via ${PAYMENT_METHODS[method]?.name || method} (Ref: ${transactionCode || order.paymentId})` }],
    });
    res.json({ success: true, data: { orderId, paymentStatus: ps, method, amount: order.totalAmount, transactionCode } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getPaymentMethods = (req, res) => {
  res.json({ success: true, data: Object.entries(PAYMENT_METHODS).map(([id, v]) => ({ id, name: v.name })) });
};

// ═══ INVOICE ═══
export const getInvoice = async (req, res) => {
  try {
    const order = Order.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    const invoiceHtml = generateInvoiceHtml(order);
    res.json({ success: true, data: { orderId: order.id, orderNumber: order.orderNumber, html: invoiceHtml } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const emailInvoice = async (req, res) => {
  try {
    const order = Order.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    const { email } = req.body;
    const to = email || order.shippingAddress?.email;
    if (!to) return res.status(400).json({ success: false, error: "No email address" });
    const html = generateInvoiceHtml(order);
    const { sendCustomEmail } = await import("../services/emailService.js");
    await sendCustomEmail(to, `Invoice — ${order.orderNumber || order.id.slice(0,8)}`, html);
    res.json({ success: true, message: `Invoice sent to ${to}` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

function generateInvoiceHtml(order) {
  const items = (order.items || []).map(i => `<tr><td style="padding:10px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${i.price}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$${i.subtotal?.toFixed(2)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#1a1a2e;color:white;padding:24px;text-align:center"><h1 style="margin:0;font-size:24px">xsow</h1><p style="margin:4px 0 0;opacity:0.8;font-size:13px">INVOICE</p></div>
    <div style="padding:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap"><div><p style="margin:0;font-size:12px;color:#888">Invoice No.</p><p style="margin:2px 0 0;font-weight:700;font-size:18px;color:#e44d26">${order.orderNumber || order.id.slice(0,8)}</p></div><div style="text-align:right"><p style="margin:0;font-size:12px;color:#888">Date</p><p style="margin:2px 0 0;font-weight:600">${new Date(order.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p></div></div>
      <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:20px"><p style="margin:0;font-size:12px;color:#888">Bill To</p><p style="margin:4px 0 0;font-weight:600">${order.shippingAddress?.fullName||"Customer"}</p><p style="margin:2px 0 0;font-size:13px;color:#666">${order.shippingAddress?.address||""}, ${order.shippingAddress?.city||""}</p><p style="margin:2px 0 0;font-size:13px;color:#666">${order.shippingAddress?.phone||""} | ${order.shippingAddress?.email||""}</p></div>
      <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f3f4f6"><th style="padding:10px;text-align:left;font-size:12px;color:#666">Item</th><th style="padding:10px;text-align:center;font-size:12px;color:#666">Qty</th><th style="padding:10px;text-align:right;font-size:12px;color:#666">Price</th><th style="padding:10px;text-align:right;font-size:12px;color:#666">Total</th></tr></thead><tbody>${items}</tbody></table>
      <div style="border-top:2px solid #1a1a2e;margin-top:12px;padding-top:12px;text-align:right"><p style="margin:4px 0;font-size:14px"><span style="color:#888">Payment:</span> <strong>${order.paymentMethod||"COD"}</strong> — <strong style="color:${order.paymentStatus==="paid"?"#16a34a":"#f59e0b"}">${order.paymentStatus||"pending"}</strong></p><p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#1a1a2e">Total: $${order.totalAmount?.toFixed(2)}</p></div>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#999">Thank you for shopping with xsow | customer@xsow.com</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
// 3-STEP SELF-HOSTED PAYMENT GATEWAY PAGES
// Step 1: Phone/ID + MPIN → Step 2: OTP → Step 3: Confirmed/Cancelled
// ═══════════════════════════════════════════════════════════

const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#fff;border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);width:100%;max-width:400px;overflow:hidden}.hdr{padding:28px 24px;text-align:center;color:#fff}.hdr h2{font-size:20px;margin-top:8px}.hdr p{opacity:.85;font-size:12px;margin-top:4px}.amt{background:#f8f9fa;border-radius:14px;padding:18px;text-align:center;margin:20px 24px}.amt .l{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px}.amt .v{font-size:34px;font-weight:800;margin-top:4px}.bd{padding:0 24px 24px}label{display:block;font-size:12px;font-weight:600;color:#555;margin:14px 0 5px}input{width:100%;padding:13px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;outline:none;transition:.2s}input:focus{border-color:#4a90d9;box-shadow:0 0 0 3px rgba(74,144,217,.1)}.btn{width:100%;padding:15px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:18px;transition:.2s;color:#fff}.btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.12)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}.btn2{background:#e5e7eb;color:#374151;margin-top:10px}.btn2:hover{background:#d1d5db}.ft{padding:14px;background:#f8f9fa;text-align:center;font-size:10px;color:#aaa}.err{background:#fef2f2;color:#dc2626;padding:10px 14px;border-radius:10px;font-size:13px;margin-top:12px;display:none}.step{display:none}.step.active{display:block}.dots{display:flex;justify-content:center;gap:8px;margin:16px 0}.dot{width:10px;height:10px;border-radius:50%;background:#ddd;transition:.3s}.dot.on{width:28px;border-radius:5px}.sp{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-radius:50%;border-top-color:#fff;animation:sp .7s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`;

function dots(step, color) {
  return `<div class="dots"><div class="dot${step>=1?` on" style="background:${color}`:""}""></div><div class="dot${step>=2?` on" style="background:${color}`:""}""></div><div class="dot${step>=3?` on" style="background:${color}`:""}""></div></div>`;
}

// eSewa: 3-step page
export const esewaPayPage = (req, res) => {
  const { orderId, txnId, amount, successUrl, failureUrl } = req.query;
  const c = "#60bb46";
  res.send(`<!DOCTYPE html><html><head><title>eSewa Payment</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}.hdr{background:linear-gradient(135deg,#60bb46,#4a9e35)}.btn-p{background:#60bb46}.btn-p:hover{background:#4a9e35}.amt .v{color:#60bb46}.dot.on{background:#60bb46}</style></head><body><div class="card"><div class="hdr"><div style="font-size:40px">📱</div><h2>eSewa Payment</h2><p>Secure Digital Wallet</p></div>
  <div class="amt"><div class="l">Amount</div><div class="v">Rs. ${amount}</div><div style="font-size:11px;color:#aaa;margin-top:4px">${txnId}</div></div>
  <div class="bd">
    ${dots(1, c)}
    <!-- STEP 1: Login -->
    <div class="step active" id="s1">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;font-size:11px;color:#92400e;margin-bottom:8px"><strong>Test:</strong> ID: 9806800001 | Password: Nepal@123</div>
      <label>eSewa ID (Phone)</label><input type="text" id="eid" placeholder="9806800001">
      <label>Password</label><input type="password" id="epw" placeholder="Nepal@123">
      <div class="err" id="e1"></div>
      <button class="btn btn-p" id="b1" onclick="step1()">Continue</button>
      <button class="btn btn2" onclick="location='${decodeURIComponent(failureUrl)}?orderId=${orderId}&status=cancelled'">Cancel</button>
    </div>
    <!-- STEP 2: OTP -->
    <div class="step" id="s2">
      <div style="text-align:center;margin:12px 0"><p style="font-size:13px;color:#666">OTP sent to <strong id="maskedPhone"></strong></p></div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;font-size:11px;color:#92400e;margin-bottom:8px"><strong>Test OTP:</strong> 123456</div>
      <label>Enter 6-digit OTP</label><input type="text" id="eotp" placeholder="123456" maxlength="6" style="text-align:center;font-size:22px;letter-spacing:8px">
      <div class="err" id="e2"></div>
      <button class="btn btn-p" id="b2" onclick="step2()">Verify & Pay</button>
      <button class="btn btn2" onclick="show(1)">← Back</button>
    </div>
    <!-- STEP 3: Result -->
    <div class="step" id="s3">
      <div style="text-align:center;padding:20px 0">
        <div id="resIcon" style="font-size:56px">✅</div>
        <h3 id="resTitle" style="margin-top:8px;font-size:20px">Payment Successful!</h3>
        <p id="resMsg" style="font-size:13px;color:#666;margin-top:6px">Rs. ${amount} paid via eSewa</p>
        <p id="resTxn" style="font-size:11px;color:#aaa;margin-top:4px"></p>
      </div>
      <button class="btn btn-p" id="b3" onclick="finish()">Continue to Store</button>
    </div>
  </div>
  <div class="ft">🔒 eSewa Secure Payment Gateway (Test Mode)</div></div>
  <script>
    var ids=['9806800001','9806800002','9806800003','9806800004','9806800005'];
    function show(n){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));document.getElementById('s'+n).classList.add('active');document.querySelectorAll('.dot').forEach((d,i)=>{if(i<n)d.classList.add('on');else d.classList.remove('on')})}
    function step1(){var id=document.getElementById('eid').value.trim(),pw=document.getElementById('epw').value.trim(),e=document.getElementById('e1'),b=document.getElementById('b1');
      if(!ids.includes(id)){e.style.display='block';e.textContent='Invalid eSewa ID';return}if(pw!=='Nepal@123'){e.style.display='block';e.textContent='Invalid password';return}
      e.style.display='none';b.disabled=true;b.innerHTML='<span class="sp"></span> Verifying...';
      document.getElementById('maskedPhone').textContent=id.slice(0,4)+'****'+id.slice(-2);
      setTimeout(function(){b.innerHTML='Continue';b.disabled=false;show(2)},1500)}
    function step2(){var otp=document.getElementById('eotp').value.trim(),e=document.getElementById('e2'),b=document.getElementById('b2');
      if(otp!=='123456'){e.style.display='block';e.textContent='Invalid OTP. Use 123456';return}
      e.style.display='none';b.disabled=true;b.innerHTML='<span class="sp"></span> Processing Payment...';
      setTimeout(function(){var txn='ES'+Date.now().toString(36).toUpperCase();document.getElementById('resTxn').textContent='Ref: '+txn;window._txn=txn;show(3)},2500)}
    function finish(){window.location='${decodeURIComponent(successUrl)}?orderId=${orderId}&method=esewa&status=COMPLETE&transactionCode='+window._txn}
  </script></body></html>`);
};

// Khalti: 3-step page
export const khaltiPayPage = (req, res) => {
  const { orderId, txnId, amount, successUrl, failureUrl } = req.query;
  const c = "#5C2D91";
  res.send(`<!DOCTYPE html><html><head><title>Khalti Payment</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}.hdr{background:linear-gradient(135deg,#5C2D91,#7B3FA0)}.btn-p{background:#5C2D91}.btn-p:hover{background:#4a2475}.amt .v{color:#5C2D91}.dot.on{background:#5C2D91}</style></head><body><div class="card"><div class="hdr"><div style="font-size:40px">💜</div><h2>Khalti Payment</h2><p>Digital Wallet</p></div>
  <div class="amt"><div class="l">Amount</div><div class="v">Rs. ${amount}</div></div>
  <div class="bd">
    ${dots(1, c)}
    <div class="step active" id="s1">
      <div style="background:#f3e8ff;border:1px solid #d8b4fe;border-radius:10px;padding:10px;font-size:11px;color:#6b21a8;margin-bottom:8px"><strong>Test:</strong> Mobile: 9800000001 | PIN: 1111</div>
      <label>Khalti Mobile Number</label><input type="text" id="km" placeholder="9800000001">
      <label>Khalti MPIN</label><input type="password" id="kp" placeholder="1111" maxlength="4">
      <div class="err" id="e1"></div>
      <button class="btn btn-p" id="b1" onclick="step1()">Continue</button>
      <button class="btn btn2" onclick="location='${decodeURIComponent(failureUrl)}?orderId=${orderId}&status=cancelled'">Cancel</button>
    </div>
    <div class="step" id="s2">
      <div style="text-align:center;margin:12px 0"><p style="font-size:13px;color:#666">OTP sent to <strong id="mp"></strong></p></div>
      <div style="background:#f3e8ff;border:1px solid #d8b4fe;border-radius:10px;padding:10px;font-size:11px;color:#6b21a8;margin-bottom:8px"><strong>Test OTP:</strong> 987654</div>
      <label>Enter OTP</label><input type="text" id="ko" placeholder="987654" maxlength="6" style="text-align:center;font-size:22px;letter-spacing:8px">
      <div class="err" id="e2"></div>
      <button class="btn btn-p" id="b2" onclick="step2()">Verify & Pay</button>
      <button class="btn btn2" onclick="show(1)">← Back</button>
    </div>
    <div class="step" id="s3">
      <div style="text-align:center;padding:20px 0"><div style="font-size:56px">✅</div><h3 style="margin-top:8px;font-size:20px">Payment Successful!</h3><p style="font-size:13px;color:#666;margin-top:6px">Rs. ${amount} paid via Khalti</p><p id="rt" style="font-size:11px;color:#aaa;margin-top:4px"></p></div>
      <button class="btn btn-p" onclick="finish()">Continue to Store</button>
    </div>
  </div>
  <div class="ft">🔒 Khalti Payment Gateway (Test Mode)</div></div>
  <script>
    function show(n){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));document.getElementById('s'+n).classList.add('active');document.querySelectorAll('.dot').forEach((d,i)=>{if(i<n)d.classList.add('on');else d.classList.remove('on')})}
    function step1(){var m=document.getElementById('km').value.trim(),p=document.getElementById('kp').value.trim(),e=document.getElementById('e1'),b=document.getElementById('b1');
      if(m!=='9800000001'){e.style.display='block';e.textContent='Use 9800000001';return}if(p!=='1111'){e.style.display='block';e.textContent='Use PIN 1111';return}
      e.style.display='none';b.disabled=true;b.innerHTML='<span class="sp"></span> Verifying...';document.getElementById('mp').textContent=m.slice(0,4)+'****'+m.slice(-2);
      setTimeout(function(){b.innerHTML='Continue';b.disabled=false;show(2)},1500)}
    function step2(){var o=document.getElementById('ko').value.trim(),e=document.getElementById('e2'),b=document.getElementById('b2');
      if(o!=='987654'){e.style.display='block';e.textContent='Use OTP 987654';return}
      e.style.display='none';b.disabled=true;b.innerHTML='<span class="sp"></span> Processing...';
      setTimeout(function(){var t='KH'+Date.now().toString(36).toUpperCase();document.getElementById('rt').textContent='Ref: '+t;window._t=t;show(3)},2500)}
    function finish(){window.location='${decodeURIComponent(successUrl)}?orderId=${orderId}&method=khalti&status=COMPLETE&transactionCode='+window._t}
  </script></body></html>`);
};

// Card: 3-step page
export const cardPayPage = (req, res) => {
  const { orderId, txnId, amount, successUrl, failureUrl } = req.query;
  const c = "#2563eb";
  res.send(`<!DOCTYPE html><html><head><title>Card Payment</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}.hdr{background:linear-gradient(135deg,#1e3a5f,#2563eb)}.btn-p{background:#2563eb}.btn-p:hover{background:#1d4ed8}.amt .v{color:#2563eb}.dot.on{background:#2563eb}</style></head><body><div class="card"><div class="hdr"><div style="font-size:40px">💳</div><h2>Card Payment</h2><p>Visa / Mastercard</p></div>
  <div class="amt"><div class="l">Amount</div><div class="v">$${amount}</div></div>
  <div class="bd">
    ${dots(1, c)}
    <div class="step active" id="s1">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px;font-size:11px;color:#1e40af;margin-bottom:8px"><strong>Test:</strong> 4242 4242 4242 4242 | 12/28 | 123</div>
      <label>Card Number</label><input type="text" id="cn" placeholder="4242 4242 4242 4242" maxlength="19">
      <div style="display:flex;gap:12px"><div style="flex:1"><label>Expiry</label><input type="text" id="ce" placeholder="MM/YY" maxlength="5"></div><div style="flex:1"><label>CVV</label><input type="password" id="cc" placeholder="123" maxlength="4"></div></div>
      <label>Cardholder Name</label><input type="text" id="cname" placeholder="JOHN DOE">
      <div class="err" id="e1"></div>
      <button class="btn btn-p" id="b1" onclick="step1()">Continue</button>
      <button class="btn btn2" onclick="location='${decodeURIComponent(failureUrl)}?orderId=${orderId}&status=cancelled'">Cancel</button>
    </div>
    <div class="step" id="s2">
      <div style="text-align:center;margin:12px 0"><div style="font-size:40px;margin-bottom:8px">🔐</div><p style="font-size:13px;color:#666">3D Secure verification sent to your bank</p></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px;font-size:11px;color:#1e40af;margin-bottom:8px"><strong>Test OTP:</strong> 112233</div>
      <label>Enter Bank OTP</label><input type="text" id="cotp" placeholder="112233" maxlength="6" style="text-align:center;font-size:22px;letter-spacing:8px">
      <div class="err" id="e2"></div>
      <button class="btn btn-p" id="b2" onclick="step2()">Authorize Payment</button>
      <button class="btn btn2" onclick="show(1)">← Back</button>
    </div>
    <div class="step" id="s3">
      <div style="text-align:center;padding:20px 0"><div style="font-size:56px">✅</div><h3 style="margin-top:8px;font-size:20px">Payment Authorized!</h3><p style="font-size:13px;color:#666;margin-top:6px">$${amount} charged to card ****<span id="last4"></span></p><p id="rt" style="font-size:11px;color:#aaa;margin-top:4px"></p></div>
      <button class="btn btn-p" onclick="finish()">Continue to Store</button>
    </div>
  </div>
  <div class="ft">🔒 256-bit SSL | PCI DSS Compliant (Test Mode)</div></div>
  <script>
    function show(n){document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));document.getElementById('s'+n).classList.add('active');document.querySelectorAll('.dot').forEach((d,i)=>{if(i<n)d.classList.add('on');else d.classList.remove('on')})}
    function step1(){var n=document.getElementById('cn').value.replace(/\\s/g,''),x=document.getElementById('ce').value,v=document.getElementById('cc').value,nm=document.getElementById('cname').value,e=document.getElementById('e1'),b=document.getElementById('b1');
      if(n.length<13){e.style.display='block';e.textContent='Invalid card number';return}if(!x.match(/\\d{2}\\/\\d{2}/)){e.style.display='block';e.textContent='Use MM/YY format';return}if(v.length<3){e.style.display='block';e.textContent='Invalid CVV';return}if(!nm){e.style.display='block';e.textContent='Enter name';return}
      e.style.display='none';b.disabled=true;b.innerHTML='<span class="sp"></span> Validating...';window._l4=n.slice(-4);document.getElementById('last4').textContent=n.slice(-4);
      setTimeout(function(){b.innerHTML='Continue';b.disabled=false;show(2)},1500)}
    function step2(){var o=document.getElementById('cotp').value.trim(),e=document.getElementById('e2'),b=document.getElementById('b2');
      if(o!=='112233'){e.style.display='block';e.textContent='Use OTP 112233';return}
      e.style.display='none';b.disabled=true;b.innerHTML='<span class="sp"></span> Authorizing...';
      setTimeout(function(){var t='CD'+Date.now().toString(36).toUpperCase();document.getElementById('rt').textContent='Ref: '+t;window._t=t;show(3)},2500)}
    function finish(){window.location='${decodeURIComponent(successUrl)}?orderId=${orderId}&method=card&status=COMPLETE&transactionCode='+window._t}
  </script></body></html>`);
};
