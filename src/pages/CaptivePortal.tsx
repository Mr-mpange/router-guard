import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wifi, Clock, Zap, Check, CreditCard, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  speed: string;
  popular?: boolean;
}

const packages: Package[] = [
  { id: "1", name: "1 Hour", price: 100, duration: "1 Hour", speed: "5 Mbps" },
  { id: "2", name: "Daily", price: 500, duration: "24 Hours", speed: "10 Mbps", popular: true },
  { id: "3", name: "Weekly", price: 1000, duration: "7 Days", speed: "15 Mbps" },
  { id: "4", name: "Monthly", price: 5000, duration: "30 Days", speed: "25 Mbps" },
];

export default function CaptivePortal() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "voucher" | null>(null);
  const [step, setStep] = useState<"packages" | "payment" | "processing">("packages");

  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setStep("payment");
  };

  const handleBack = () => {
    setStep("packages");
    setPaymentMethod(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Wifi className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">NetFlow WiFi</h1>
          <p className="text-muted-foreground mt-2">
            Connect to high-speed internet
          </p>
        </div>

        {step === "packages" && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="p-2 rounded-lg bg-success/10">
                  <Check className="w-4 h-4 text-success" />
                </div>
                <span>Connected to: <strong className="text-foreground">Main Lobby Router</strong></span>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Select a Package</h2>

            <div className="grid grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg.id)}
                  className={cn(
                    "glass-card p-4 text-left transition-all duration-300 hover:border-primary/50 relative",
                    selectedPackage === pkg.id && "border-primary glow-border"
                  )}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="font-semibold text-lg">{pkg.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {pkg.price.toLocaleString()}
                    <span className="text-sm text-muted-foreground ml-1">TZS</span>
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pkg.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {pkg.speed}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
              ← Back to packages
            </Button>

            <div className="glass-card p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Package</p>
                  <p className="font-semibold">
                    {packages.find((p) => p.id === selectedPackage)?.name}
                  </p>
                </div>
                <p className="text-xl font-bold text-primary">
                  {packages.find((p) => p.id === selectedPackage)?.price.toLocaleString()} TZS
                </p>
              </div>
            </div>

            <h2 className="text-lg font-semibold">Choose Payment Method</h2>

            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod("mobile")}
                className={cn(
                  "glass-card p-4 w-full flex items-center gap-4 transition-all duration-300 hover:border-primary/50",
                  paymentMethod === "mobile" && "border-primary"
                )}
              >
                <div className="p-3 rounded-xl bg-success/10">
                  <CreditCard className="w-5 h-5 text-success" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">
                    M-Pesa, Tigo Pesa, Airtel Money
                  </p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("voucher")}
                className={cn(
                  "glass-card p-4 w-full flex items-center gap-4 transition-all duration-300 hover:border-primary/50",
                  paymentMethod === "voucher" && "border-primary"
                )}
              >
                <div className="p-3 rounded-xl bg-primary/10">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Voucher Code</p>
                  <p className="text-sm text-muted-foreground">
                    Use a prepaid voucher
                  </p>
                </div>
              </button>
            </div>

            {paymentMethod === "mobile" && (
              <div className="space-y-4 pt-4 animate-fade-in">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input placeholder="+255 7XX XXX XXX" />
                </div>
                <Button className="w-full" size="lg" onClick={() => setStep("processing")}>
                  Pay Now
                </Button>
              </div>
            )}

            {paymentMethod === "voucher" && (
              <div className="space-y-4 pt-4 animate-fade-in">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Voucher Code</label>
                  <Input placeholder="XXXX-XXXX-XXXX" className="text-center font-mono tracking-widest" />
                </div>
                <Button className="w-full" size="lg" onClick={() => setStep("processing")}>
                  Redeem Voucher
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-pulse">
              <Wifi className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
            <p className="text-muted-foreground">
              Please wait while we activate your internet access
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
