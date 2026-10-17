import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const services = [
  { icon: 'washer', title: 'Wash & Fold', price: '₹79/kg', text: 'Everyday clothes washed, dried and neatly folded.' },
  { icon: 'hanger', title: 'Dry Cleaning', price: 'From ₹149', text: 'Expert care for delicate fabrics and special outfits.' },
  { icon: 'iron', title: 'Ironing', price: 'From ₹15', text: 'Crisp, wrinkle-free clothes delivered ready to wear.' },
];

const steps = [
  { icon: 'package', title: 'Book your pickup', text: 'Choose your service and a convenient time.' },
  { icon: 'truck', title: 'We collect', text: 'Our rider picks up from your doorstep.' },
  { icon: 'sparkle', title: 'We clean with care', text: 'Your clothes receive expert treatment.' },
  { icon: 'check', title: 'Fresh delivery', text: 'Clean clothes arrive neatly packed.' },
];

export default function HomePage() {
  return <>
    <section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow">Doorstep laundry, simplified</span><h1>More life.<br /><em>Less laundry.</em></h1><p>We pick up, expertly clean, and deliver your clothes fresh to your doorstep — right on time.</p><div className="hero-actions"><Link to="/book" className="button">Book a pickup <Icon name="arrowRight" size={18} /></Link><a href="#services" className="text-link">View services</a></div><div className="trust-row">{['Free pickup & delivery', 'Quality checked', 'Easy tracking'].map((item) => <span key={item}><i><Icon name="check" size={13} /></i>{item}</span>)}</div></div>
      <div className="hero-visual" aria-label="Clean laundry illustration"><div className="sun"></div><div className="washer"><div className="washer-panel"><i></i><i></i></div><div className="washer-door"><Icon name="sparkle" size={58} /></div></div><div className="basket"><span></span><span></span><span></span></div><div className="floating-card"><b><Icon name="check" size={18} /></b><div><strong>Pickup confirmed!</strong><small>Tomorrow, 9–11 AM</small></div></div></div>
    </div></section>
    <section className="section" id="services"><div className="container"><div className="section-heading"><span className="eyebrow">What we clean</span><h2>Care for every fabric</h2><p>Simple pricing, careful cleaning, and no hidden surprises.</p></div><div className="service-grid">{services.map((service) => <article className="service-card" key={service.title}><div className="service-icon"><Icon name={service.icon} size={26} /></div><div className="service-top"><h3>{service.title}</h3><b>{service.price}</b></div><p>{service.text}</p><Link to="/book">Choose service <Icon name="arrowRight" size={15} /></Link></article>)}</div></div></section>
    <section className="how-section"><div className="container"><div className="section-heading"><span className="eyebrow">Four easy steps</span><h2>Laundry day, without the laundry</h2></div><div className="steps">{steps.map((step, index) => <div className="step" key={step.title}><span>0{index + 1}</span><div className="step-dot"><Icon name={step.icon} size={24} /></div><h3>{step.title}</h3><p>{step.text}</p></div>)}</div></div></section>
    <section className="cta"><div className="container cta-inner"><div><span className="eyebrow light">Ready when you are</span><h2>Take laundry off your list.</h2></div><Link to="/book" className="button button-light">Book your first pickup <Icon name="arrowRight" size={18} /></Link></div></section>
  </>;
}
