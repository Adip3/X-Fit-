import { useState } from "react";
import Button from "../Components/Button";
import api from "../api/config";

const Subscribe = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email");
      return;
    }
    try {
      await api.post("/subscribers", { email });
      setStatus("success");
      setMessage("Subscribed successfully!");
      setEmail("");
      setTimeout(() => { setStatus(null); setMessage(""); }, 3000);
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Subscription failed");
      setTimeout(() => { setStatus(null); setMessage(""); }, 3000);
    }
  };

  return (
    <section
      className="max-coltainer flex justify-between items-center max-lg:flex-col gap-10"
      id="contact-us"
    >
      <h3 className="text-4xl leading-[68px] lg:max-w-md font-palanquin font-bold">
        Sign Up for<span className="text-coral-red"> Updates </span>& Newsletter
      </h3>
      <div className="lg:max-w[40%] w-full flex flex-col gap-2">
        <div className="flex items-center max-sm:flex-col gap-5 p-2.5 sm:border sm:border-slate-300 rounded-full">
          <input
            type="email"
            placeholder="subscribe@xsow.com"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
          />
          <div className="flex max-sm:justify-end items-center max-sm:w-full" onClick={handleSubscribe}>
            <Button label={"sign Up"} fullWidth />
          </div>
        </div>
        {message && (
          <p className={`text-sm font-montserrat ml-4 ${status === "success" ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
};

export default Subscribe;