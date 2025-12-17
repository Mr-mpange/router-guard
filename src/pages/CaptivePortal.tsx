import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, Clock, CreditCard, Smartphone, AlertCircle, CheckCircle, Shield, Ticket, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { portalApi, testApiConnection } from '@/lib/api';

interface Package {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  durationText: string;
  priceFormatted: string;
}

interface Session {
  id: string;
  packageName: string;
  startTime: string;
  expiresAt: string;
  timeRemaining: number;
  timeRemainingFormatted: string;
  routerName: string;
  routerLocation?: string;
  bytesUp: string;
  bytesDown: string;
  status: string;
}

interface RouterInfo {
  id: string;
  name: string;
  location?: string;
  isOnline: boolean;
}

export default function CaptivePortal() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY'>('MPESA');
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [routerInfo, setRouterInfo] = useState<RouterInfo | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(true);
  // In a real captive portal, these would be detected from the network/URL parameters
  const [deviceMac] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mac') || '00:11:22:33:44:55';
  });
  
  const [routerId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('router') || 'default'; // Will get first available router from backend
  });

  const [ipAddress] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ip') || '192.168.1.100';
  });

  useEffect(() => {
    loadPackages();
    checkDeviceStatus();
    loadRouterInfo();
    
    // Auto-refresh session status every 30 seconds
    const interval = setInterval(checkDeviceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPackages = async () => {
    try {
      // First test API connection
      const isConnected = await testApiConnection();
      if (!isConnected) {
        toast.error('Cannot connect to server. Please ensure the backend is running on http://localhost:3001');
        return;
      }
      
      const data = await portalApi.getPackages();
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load internet packages. Please check your connection.');
    }
  };

  const loadRouterInfo = async () => {
    try {
      const data = await portalApi.getRouterInfo(routerId);
      setRouterInfo(data.router);
    } catch (error) {
      console.error('Failed to load router info:', error);
      // Don't set router info if we can't load it
    }
  };

  const checkDeviceStatus = async () => {
    try {
      const data = await portalApi.getDeviceStatus(deviceMac, routerId, ipAddress);
      
      if (data.hasActiveSession) {
        setActiveSession(data.session);
        setDeviceConnected(true);
      } else {
        setActiveSession(null);
        setDeviceConnected(data.deviceConnected !== false);
        
        if (data.redirectToRouter) {
          toast.error(`You have an active session on ${data.redirectToRouter}. Please connect to that router.`);
        }
      }
    } catch (error) {
      console.error('Failed to check device status:', error);
      setDeviceConnected(false);
      toast.error('Unable to connect to the system. Please check your connection.');
    }
  };

  const purchasePackage = async () => {
    if (!selectedPackage || !phoneNumber) {
      toast.error('Please select a package and enter your phone number');
      return;
    }

    if (!deviceConnected) {
      toast.error('You must be connected to the Wi-Fi network to purchase internet access');
      return;
    }

    setLoading(true);
    try {
      const data = await portalApi.purchasePackage({
        packageId: selectedPackage.id,
        deviceMac,
        ipAddress,
        routerId,
        phoneNumber,
        paymentMethod,
      });

      if (data.success) {
        toast.success('Payment initiated successfully!');
        
        // Show payment instructions
        toast.info(data.instructions || 'Please complete payment on your mobile money app');
        
        // Start polling for payment status
        if (data.payment?.transactionId) {
          pollPaymentStatus(data.payment.transactionId);
        }
        
        setSelectedPackage(null);
        setPhoneNumber('');
      } else {
        toast.error(data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase package. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 30; // Poll for 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/portal/payment-status/${transactionId}`);
        const data = await response.json();

        if (data.status === 'COMPLETED') {
          toast.success('Payment confirmed! Internet access activated.');
          checkDeviceStatus(); // Refresh to show active session
          return;
        } else if (data.status === 'FAILED') {
          toast.error('Payment failed. Please try again.');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          toast.warning('Payment is taking longer than expected. Please check your mobile money app.');
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
      }
    };

    // Start checking after 5 seconds
    setTimeout(checkStatus, 5000);
  };

  const redeemVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Please enter a voucher code');
      return;
    }

    if (!deviceConnected) {
      toast.error('You must be connected to the Wi-Fi network to redeem a voucher');
      return;
    }

    setLoading(true);
    try {
      const data = await portalApi.redeemVoucher({
        voucherCode: voucherCode.trim().toUpperCase(),
        deviceMac,
        ipAddress,
        routerId,
      });

      if (data.success) {
        toast.success('Voucher redeemed successfully! Internet access activated.');
        setActiveSession(data.session);
        setVoucherCode('');
      } else {
        toast.error(data.error || 'Voucher redemption failed');
      }
    } catch (error) {
      console.error('Voucher redemption error:', error);
      toast.error('Failed to redeem voucher');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: string) => {
    const num = parseInt(bytes);
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Connection status alert
  if (!deviceConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4" style={{ color: '#374151' }}>
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-red-200 bg-white">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-700">Connection Required</CardTitle>
              <CardDescription className="text-gray-600">You must be connected to the Wi-Fi network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  For security reasons, internet access can only be purchased when connected to the Wi-Fi network.
                  Please connect to the Wi-Fi and try again.
                </AlertDescription>
              </Alert>
              
              {routerInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Network Information</h3>
                  <div className="text-sm space-y-1">
                    <div>Network: <span className="font-mono">{routerInfo.name}</span></div>
                    {routerInfo.location && (
                      <div>Location: <span className="font-mono">{routerInfo.location}</span></div>
                    )}
                    <div>Status: <Badge variant={routerInfo.isOnline ? "default" : "destructive"}>
                      {routerInfo.isOnline ? "Online" : "Offline"}
                    </Badge></div>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Router offline
  if (routerInfo && !routerInfo.isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" style={{ color: '#374151' }}>
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg bg-white border-gray-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Wifi className="w-8 h-8 text-gray-600" />
              </div>
              <CardTitle className="text-gray-700">Network Temporarily Unavailable</CardTitle>
              <CardDescription className="text-gray-600">The router is currently offline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The network router is currently offline. Please try again later or contact support.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active session view
  if (activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4" style={{ color: '#374151' }}>
        <div className="max-w-md mx-auto space-y-4">
          <Card className="shadow-lg bg-white border-gray-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-green-700">Internet Access Active</CardTitle>
              <CardDescription className="text-gray-600">You are connected and online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Package</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">{activeSession.packageName}</Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Time Remaining</span>
                  <span className="text-sm font-mono font-bold text-green-700">
                    {activeSession.timeRemainingFormatted}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Network</span>
                  <span className="text-sm text-gray-600">{activeSession.routerName}</span>
                </div>
                {activeSession.routerLocation && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Location</span>
                    <span className="text-sm text-gray-600">{activeSession.routerLocation}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <Badge variant={activeSession.status === 'ACTIVE' ? 'default' : 'secondary'} 
                         className={activeSession.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800'}>
                    {activeSession.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-700">{formatBytes(activeSession.bytesDown)}</div>
                  <div className="text-xs text-blue-600">Downloaded</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-700">{formatBytes(activeSession.bytesUp)}</div>
                  <div className="text-xs text-green-600">Uploaded</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={checkDeviceStatus}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setActiveSession(null)}
                >
                  Extend Time
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main portal interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" style={{ color: '#374151' }}>
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg bg-white border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Wifi className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-gray-900">NetFlow WiFi Portal</CardTitle>
            <CardDescription className="text-gray-600">
              {routerInfo ? `Connected to ${routerInfo.name}` : 'Get internet access'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="packages" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="packages">Buy Package</TabsTrigger>
                <TabsTrigger value="voucher">Use Voucher</TabsTrigger>
              </TabsList>
              
              <TabsContent value="packages" className="space-y-4">
                {!selectedPackage ? (
                  <div className="space-y-3">
                    <h3 className="font-medium">Choose a package:</h3>
                    {packages.map((pkg) => (
                      <Card 
                        key={pkg.id} 
                        className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-200 hover:bg-blue-50 bg-white"
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Clock className="w-4 h-4 mr-1" />
                                {pkg.durationText}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{pkg.priceFormatted}</div>
                            </div>
                          </div>
                          {pkg.description && (
                            <p className="text-sm text-gray-500 mt-2">{pkg.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{selectedPackage.name}</h4>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Clock className="w-4 h-4 mr-1" />
                              {selectedPackage.durationText}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{selectedPackage.priceFormatted}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0712345678 or +255712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {[
                            { value: 'MPESA', label: 'M-Pesa', color: 'bg-green-100 text-green-700' },
                            { value: 'TIGO_PESA', label: 'Tigo Pesa', color: 'bg-blue-100 text-blue-700' },
                            { value: 'AIRTEL_MONEY', label: 'Airtel Money', color: 'bg-red-100 text-red-700' },
                          ].map((method) => (
                            <Button
                              key={method.value}
                              variant={paymentMethod === method.value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPaymentMethod(method.value as any)}
                              className="flex flex-col items-center p-3 h-auto"
                            >
                              <Smartphone className="w-4 h-4 mb-1" />
                              <span className="text-xs">{method.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedPackage(null)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={purchasePackage}
                        disabled={loading || !phoneNumber.trim()}
                        className="flex-1"
                      >
                        {loading ? 'Processing...' : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Secure Payment:</strong> You will receive a payment prompt on your phone. 
                        Internet access activates immediately after successful payment.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="voucher" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="voucher">Voucher Code</Label>
                    <Input
                      id="voucher"
                      type="text"
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="mt-1 font-mono"
                    />
                  </div>

                  <Button 
                    onClick={redeemVoucher}
                    disabled={loading || !voucherCode.trim()}
                    className="w-full"
                  >
                    {loading ? 'Redeeming...' : (
                      <>
                        <Ticket className="w-4 h-4 mr-2" />
                        Redeem Voucher
                      </>
                    )}
                  </Button>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Enter your voucher code to get instant internet access. 
                      Voucher codes are typically 8-12 characters long.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
