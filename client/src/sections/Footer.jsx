import { Link } from "react-router-dom";
import { copyrightSign } from "../assets/icons";
import footerLogo from "../assets/images/xxsow.png";
import { footerLinks, socialMedia } from "../constants";

const Footer = () => {
  const isExt = (l) => l.startsWith("http") || l.startsWith("mailto:") || l.startsWith("tel:");
  return (
    <footer className="max-container">
      <div className="flex justify-between items-start gap-20 flex-wrap max-lg:flex-col">
        <div className="flex flex-col items-start">
          <Link to="/"><img src={footerLogo} alt="logo" width={150} height={46} /></Link>
          <p className="mt-6 text-base leading-7 font-montserrat text-white-400 sm:max-w-sm">Get shoes ready for the new term at your nearest xsow store. Find your perfect size in store. Get rewards</p>
          <div className="flex items-center gap-5 mt-8">{socialMedia.map((icon, id) => (<a key={id} href={icon.link} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center w-12 h-12 bg-white rounded-full"><img src={icon.src} alt={icon.alt} width={24} height={24} /></a>))}</div>
        </div>
        <div className="flex flex-1 justify-between lg:gap-10 gap-20 flex-wrap">
          {footerLinks.map((section, i) => (
            <div key={i}>
              <h4 className="text-white font-montserrat text-2xl leading-normal font-medium mb-6">{section.title}</h4>
              <ul>{section.links.map(({ name, link }, idx) => (
                <li key={idx} className="mt-3 text-white-400 font-montserrat text-base leading-normal hover:text-slate-gray cursor-pointer">
                  {isExt(link) ? <a href={link} target={link.startsWith("http")?"_blank":undefined} rel={link.startsWith("http")?"noopener noreferrer":undefined}>{name}</a> : <Link to={link}>{name}</Link>}
                </li>
              ))}</ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-white-400 mt-24 max-sm:flex-col max-sm:items-center">
        <div className="flex flex-1 justify-start items-center gap-2 font-montserrat"><img src={copyrightSign} alt="copyright" width={20} height={20} className="rounded-full m-0" /><p>Copyright. All rights reserved.</p></div>
        <Link to="/privacy-policy" className="font-montserrat cursor-pointer hover:text-white transition-colors">Terms & Conditions</Link>
      </div>
    </footer>
  );
};
export default Footer;
