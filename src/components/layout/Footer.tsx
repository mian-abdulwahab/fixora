import { Link } from "react-router-dom";
import { Wrench, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const footerLinks = {
    company: [
      { label: t("footer.aboutUs"), href: "/about" },
      { label: t("footer.careers"), href: "/careers" },
      { label: t("footer.press"), href: "/press" },
      { label: t("footer.blog"), href: "/blog" },
    ],
    support: [
      { label: t("footer.helpCenter"), href: "/help" },
      { label: t("footer.safety"), href: "/safety" },
      { label: t("footer.terms"), href: "/terms" },
      { label: t("footer.privacy"), href: "/privacy" },
    ],
    services: [
      { label: t("category.plumbing"), href: "/services?category=plumbing" },
      { label: t("category.electrical"), href: "/services?category=electrical" },
      { label: t("category.hvac"), href: "/services?category=hvac" },
      { label: t("category.carpentry"), href: "/services?category=carpentry" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Fixora</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">{t("footer.description")}</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="mailto:support@fixora.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />support@fixora.com
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />+1 (234) 567-890
              </a>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />Sahiwal, Pakistan</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.company")}</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("footer.services")}</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} Fixora. {t("footer.rights")}</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} className="w-9 h-9 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-muted-foreground transition-all duration-200" aria-label={social.label}>
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
