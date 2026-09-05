import CTASection from "../components/landing/CTASection";
import Features from "../components/landing/Features";
import Footer from "../components/landing/Footer";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import Nav from "../components/landing/Nav";
import Security from "../components/landing/Security";

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Security />
      <CTASection />
      <Footer />
    </div>
  );
}
