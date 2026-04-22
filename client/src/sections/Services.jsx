import ServiceCard from "../Components/ServiceCard";
import { services } from "../constants";
const Services = () => {
  return (
    <section className="max-container flex justify-center flex-wrap gap-9 max-sm:ml-4">
      {services.map((service, index) => (
        <ServiceCard key={index} {...service} />
      ))}
    </section>
  );
};

export default Services;
