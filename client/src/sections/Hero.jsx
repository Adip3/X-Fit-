import { useState, useEffect } from "react";
import Button from "../Components/Button";
import { arrowRight } from "../assets/icons";
import { shoes, statistics } from "../constants";
import { bigShoe1 } from "../assets/images";
import ShoeCard from "../Components/ShoeCard";
import { settingsAPI } from "../api";
import Aos from "aos";
import "aos/dist/aos.css";

const Hero = () => {
  const [bigShoeImg, setbigShoeImg] = useState(bigShoe1);
  const [h, setH] = useState({ heroTagline: "Our Summer Collection", heroTitle: "The New Arrival", heroBrand: "xsow", heroSubtitle: "Discover stylish xsow arrivals, quality comfort, and innovation for your active life." });
  useEffect(() => {
    Aos.init({ duration: 1000 });
    settingsAPI.getPublic().then(r => { const s = r.data.data; if(s) setH(prev => ({ heroTagline: s.heroTagline||prev.heroTagline, heroTitle: s.heroTitle||prev.heroTitle, heroBrand: s.heroBrand||prev.heroBrand, heroSubtitle: s.heroSubtitle||prev.heroSubtitle })); }).catch(()=>{});
  }, []);
  return (
    <section id="home" className="w-full flex xl:flex-row flex-col justify-center min-h-screen gap-10 max-container">
      <div className="relative xl:w-2/5 flex flex-col justify-center items-start w-full max-xl:padding-x pt-28">
        <p className="text-xl font-montserrat text-coral-red">{h.heroTagline}</p>
        <h1 className="mt-10 font-palanquin text-8xl max-sm:text-[72px] max-sm:leading-[82px] font-bold">
          <span className="xl:bg-white xl:whitespace-nowrap relative z-10 pr-10">{h.heroTitle}</span><br/>
          <span className="text-coral-red inline-block mt-3">{h.heroBrand}</span> Shoes
        </h1>
        <p className="font-montserrat text-slate-gray text-lg leading-8 mt-6 mb-14 sm:max-w-sm">{h.heroSubtitle}</p>
        <Button label="Shop now" iconURL={arrowRight} />
        <div className="flex justify-start items-start max-sm:justify-center flex-wrap w-full mt-20 gap-16">
          {statistics.map(s=><div key={s.label}><p className="text-4xl max-sm:text-3xl font-palanquin font-bold">{s.value}</p><p className="leading-7 font-montserrat text-slate-gray">{s.label}</p></div>)}
        </div>
      </div>
      <div className="relative flex-1 flex justify-center items-center xl:min-h-screen max-xl:py-40 bg-primary bg-hero bg-cover bg-center">
        <img src={bigShoeImg} alt="shoe collection" width={610} height={500} className="object-contain relative z-10" data-aos="fade-left" />
        <div className="flex sm:gap-6 gap-4 absolute -bottom-[5%] sm:left-[10%] max-sm:px-6">
          {shoes.map(shoe=><div key={shoe}><ShoeCard imgUrl={shoe} changeBigShoeImage={s=>setbigShoeImg(s)} bigShoeImg={bigShoeImg}/></div>)}
        </div>
      </div>
    </section>
  );
};
export default Hero;
