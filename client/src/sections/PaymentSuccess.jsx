import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { paymentAPI } from "../api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const orderId = searchParams.get("orderId");
        const method = searchParams.get("method") || "esewa";
        const status = searchParams.get("status") || "COMPLETE";
        const transactionCode = searchParams.get("transactionCode") || "";

        if (!orderId) { setError("Missing order ID"); setVerifying(false); return; }

        const res = await paymentAPI.verify({ orderId, method, status, transactionCode });
        setResult(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || "Payment verification failed");
      } finally { setVerifying(false); }
    };
    verify();
  }, []);

  if (verifying) return (
    <section className="pt-32 padding-x pb-16 max-container">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="font-palanquin text-2xl font-bold mb-2">Verifying Payment...</h1>
        <p className="font-montserrat text-slate-gray">Confirming your payment</p>
      </div>
    </section>
  );

  const isPaid = result?.paymentStatus === "paid";

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      <div className="max-w-lg mx-auto text-center">
        <div className={`w-20 h-20 ${error || !isPaid ? "bg-red-100" : "bg-green-100"} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {error || !isPaid ? (
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          )}
        </div>
        <h1 className="font-palanquin text-3xl font-bold text-gray-900 mb-2">
          {error ? "Verification Failed" : isPaid ? "Payment Successful!" : "Payment Issue"}
        </h1>
        {error ? (
          <p className="font-montserrat text-slate-gray mb-6">{error}</p>
        ) : (
          <>
            <p className="font-montserrat text-slate-gray mb-4">
              {isPaid ? `Your payment via ${result.method === "esewa" ? "eSewa" : result.method === "khalti" ? "Khalti" : "Card"} has been confirmed.` : `Status: ${result?.paymentStatus}`}
            </p>
            <div className={`${isPaid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-xl p-4 mb-6 text-left max-w-xs mx-auto`}>
              <div className="space-y-1.5">
                <p className="font-montserrat text-sm"><span className="text-slate-gray">Amount:</span> <strong>${result?.amount}</strong></p>
                <p className="font-montserrat text-sm"><span className="text-slate-gray">Status:</span> <strong className={isPaid ? "text-green-600" : "text-red-600"}>{result?.paymentStatus}</strong></p>
                <p className="font-montserrat text-sm"><span className="text-slate-gray">Method:</span> <strong>{result?.method === "esewa" ? "eSewa" : result?.method === "khalti" ? "Khalti" : "Card"}</strong></p>
                {result?.transactionCode && <p className="font-montserrat text-sm"><span className="text-slate-gray">Ref:</span> <strong>{result.transactionCode}</strong></p>}
              </div>
            </div>
          </>
        )}
        <div className="flex gap-4 justify-center">
          <Link to="/orders" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500">View My Orders</Link>
          <Link to="/products" className="border border-gray-200 text-gray-700 font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-50">Continue Shopping</Link>
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccess;
