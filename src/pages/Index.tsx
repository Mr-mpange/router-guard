import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  Router,
  Shield,
  Zap,
  Clock,
  CreditCard,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Router,
    title: "MikroTik Integration",
    description: "Seamless API integration with MikroTik routers for real-time control",
  },
  {
    icon: Shield,
    title: "Router-Bound Security",
    description: "Internet access strictly enforced at router level, not just online",
  },
  {
    icon: Clock,
    title: "Time-Based Packages",
    description: "Auto-expiring sessions with automatic disconnection",
  },
  {
    icon: CreditCard,
    title: "Mobile Money Payments",
    description: "Integrated M-Pesa, Tigo Pesa, and Airtel Money support",
  },
];

const packages = [
  { duration: "1 Hour", price: 100 },
  { duration: "24 Hours", price: 500 },
  { duration: "7 Days", price: 1000 },
  { duration: "30 Days", price: 5000 },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Wifi className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">NetFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/portal">
                <Button variant="ghost" size="sm">
                  Captive Portal
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Router-Enforced WiFi Access Control
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 animate-fade-in">
            Professional
            <span className="gradient-text"> WiFi Management </span>
            for ISPs & Venues
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            Control internet access at the router level. Time-based packages, mobile money payments, and automatic session expiry. Perfect for cafés, hotels, campuses, and ISPs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/dashboard">
              <Button size="xl" variant="glow" className="gap-2">
                View Dashboard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/portal">
              <Button size="xl" variant="outline">
                Captive Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to manage paid WiFi access with security and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Preview */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Flexible Package Configuration</h2>
            <p className="text-muted-foreground">
              Define custom time-based packages with automatic expiry
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.duration}
                className="glass-card p-6 text-center hover:border-primary/30 transition-all duration-300"
              >
                <p className="text-muted-foreground text-sm mb-2">{pkg.duration}</p>
                <p className="text-2xl font-bold">
                  {pkg.price.toLocaleString()}
                  <span className="text-sm text-muted-foreground ml-1">TZS</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Guarantees */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-success/10">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold">Security Guarantees</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Internet access physically limited to router coverage",
                "Online payments alone cannot grant access",
                "Time expiry is unavoidable and automatic",
                "WiFi password reuse does not bypass restrictions",
                "MAC address binding prevents spoofing",
                "One device = one active session",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-success/10 mt-0.5">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Deploy NetFlow for your venue or ISP today
          </p>
          <Link to="/login">
            <Button size="xl" variant="glow" className="gap-2">
              Access Admin Panel
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 NetFlow WiFi Management System. Built for ISPs & Venues.</p>
        </div>
      </footer>
    </div>
  );
}
