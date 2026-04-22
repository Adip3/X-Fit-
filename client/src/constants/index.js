import {
  facebook,
  instagram,
  shieldTick,
  support,
  truckFast,
  twitter,
  tiktok,
  whatsapp,
} from "../assets/icons";
import {
  bigShoe1,
  bigShoe2,
  bigShoe3,
  customer1,
  customer2,
  shoe4,
  shoe5,
  shoe6,
  shoe7,
  profil,
  thumbnailShoe1,
  thumbnailShoe2,
  thumbnailShoe3,
} from "../assets/images";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/sales", label: "Sales" },
];


export const shoes = [
  {
    thumbnail: thumbnailShoe1,
    bigShoe: bigShoe1,
  },
  {
    thumbnail: thumbnailShoe2,
    bigShoe: bigShoe2,
  },
  {
    thumbnail: thumbnailShoe3,
    bigShoe: bigShoe3,
  },
];

export const statistics = [
  { value: "1k+", label: "Brands" },
  { value: "500+", label: "Shops" },
  { value: "250k+", label: "Customers" },
];

export const products = [
  {
    imgURL: shoe4,
    name: "Nike Air Jordan-01",
    price: "2000",
  },
  {
    imgURL: shoe5,
    name: "Nike Air Jordan-10",
    price: "2100",
  },
  {
    imgURL: shoe6,
    name: "Nike Air Jordan-100",
    price: "22000",
  },
  {
    imgURL: shoe7,
    name: "Nike Air Jordan-001",
    price: "2300",
  },
];

export const services = [
  {
    imgURL: truckFast,
    label: "Free shipping",
    subtext: "Enjoy seamless shopping with our complimentary shipping service.",
  },
  {
    imgURL: shieldTick,
    label: "Secure Payment",
    subtext:
      "Experience worry-free transactions with our secure payment options.",
  },
  {
    imgURL: support,
    label: "Love to help you",
    subtext: "Our dedicated team is here to assist you every step of the way.",
  },
];

export const reviews = [
  {
    imgURL: profil,
    customerName: "Ram",
    rating: 4.5,
  },
  {
    imgURL: customer2,
    customerName: "HAri",
    rating: 4.5,
  },
];

export const footerLinks = [
  {
    title: "Products",
    links: [
      { name: "All Products", link: "/products" },
      { name: "New Arrivals", link: "/new-arrivals" },
      { name: "Top Selling", link: "/top-selling" },
      { name: "Sales & Deals", link: "/sales" },
    ],
  },
  {
    title: "Help",
    links: [
      { name: "About us", link: "/about-us" },
      { name: "FAQs", link: "/about-us" },
      { name: "How it works", link: "/about-us" },
      { name: "Privacy policy", link: "/privacy-policy" },
    ],
  },
  {
    title: "Get in touch",
    links: [
      { name: "customer@xsow.com", link: "mailto:customer@xsow.com" },
      { name: "+92554862344", link: "tel:+92554862354" },
    ],
  },
];

export const socialMedia = [
  {
    src: facebook,
    alt: "facebook logo",
    link: "https://www.facebook.com/"
  },
  {
    src: twitter,
    alt: "twitter logo",
    link: "https://www.twitter.com/"
  },
  {
    src: instagram,
    alt: "instagram logo",
    link: "https://www.instagram.com/xsow_np/"
  },
  {
    src: tiktok,
    alt: "tiktok logo",
    link: "https://www.tiktok.com/@xsow_np?_r=1&_t=ZS-95T2DgLuqVc"
  },
  {
    src: whatsapp,
    alt: "whatsapp logo",
    link: "https://wa.me/9779806529292" // 👉 replace with your number
  }
];