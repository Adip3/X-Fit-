import { Link, useSearchParams } from "react-router-dom";

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");

  return (
    <section className="pt-32 padding-x pb-16 max-container">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h1 className="font-palanquin text-3xl font-bold text-gray-900 mb-2">
          {status === "cancelled" ? "Payment Cancelled" : "Payment Failed"}
        </h1>
        <p className="font-montserrat text-slate-gray mb-6">
          {status === "cancelled"
            ? "You cancelled the payment. Your order has been saved — you can retry payment anytime."
            : "Something went wrong with your payment. Your order has been saved."}
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/orders" className="bg-coral-red text-white font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-500">View My Orders</Link>
          <Link to="/cart" className="border border-gray-200 text-gray-700 font-montserrat text-sm font-medium px-6 py-3 rounded-xl hover:bg-gray-50">Back to Cart</Link>
        </div>
      </div>
    </section>
  );
};

export default PaymentFailure;
