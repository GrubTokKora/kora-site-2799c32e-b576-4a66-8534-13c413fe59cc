import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Menu } from './components/Menu';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { VoiceAgentWidget } from './components/VoiceAgentWidget';
import { siteData } from './data';

const BUSINESS_ID = "2799c32e-b576-4a66-8534-13c413fe59cc";

function App() {
  return (
    <>
      <Header businessName={siteData.business.name} />
      <main>
        <Hero heroData={siteData.hero} actions={siteData.actions} />
        <About description={siteData.business.description} />
        <Menu menuData={siteData.menu} />
        <Contact contactData={siteData.contact} hoursData={siteData.hours} businessId={BUSINESS_ID} />
      </main>
      <Footer businessName={siteData.business.name} businessId={BUSINESS_ID} />
      <VoiceAgentWidget businessId={BUSINESS_ID} />
    </>
  )
}

export default App