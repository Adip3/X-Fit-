import { Link } from "react-router-dom";

const MaintenancePage = ({ message }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
    <div className="max-w-lg w-full text-center">
      <div className="w-24 h-24 mx-auto mb-8 bg-coral-red/10 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-coral-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h1 className="font-palanquin text-4xl font-bold text-gray-900 mb-4">Under <span className="text-coral-red">Maintenance</span></h1>
      <p className="font-montserrat text-lg text-slate-gray mb-8">{message || "We're currently updating our store. Please check back soon!"}</p>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-gray font-montserrat">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-red opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-coral-red"></span></span>
          We'll be back shortly
        </div>
        <Link to="/admin/dashboard" className="font-montserrat text-sm text-coral-red hover:underline">Admin? Sign in here</Link>
      </div>
    </div>
  </div>
);

export default MaintenancePage;
