import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Wifi, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentResult {
  status: string;
  amount: number;
  paymentMethod: string;
  session?: {
    id: string;
    status: string;
    packageName: string;
    expiresAt: string;
    routerName: string;
  };
  voucher?: {
    code: string;
    packageName: string;
    validUntil: string;
  };
}

export default function PaymentSuccess() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      checkPaymentResult();
    }
  }, [transactionId]);

  const checkPaymentResult = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/portal/payment-status/${transactionId}`);
      const data = await response.json();
      setPaymentResult(data);
    } catch (error) {
      console.error('Failed to check payment result:', error);
      toast.error('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Voucher code copied to clipboard');
  };

  const downloadVoucher = (voucher: any) => {
    const voucherText = `
NetFlow WiFi Voucher
====================
Voucher Code: ${voucher.code}
Package: ${voucher.packageName}
Valid Until: ${voucher.validUntil}

Instructions:
1. Connect to the WiFi network
2. Open your browser and go to the captive portal
3. Click "Use Voucher" tab
4. Enter the voucher code above
5. Enjoy your internet access!

Thank you for choosing NetFlow WiFi!
    `;

    const blob = new Blob([voucherText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetFlow-Voucher-${voucher.code}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!paymentResult || paymentResult.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-700">Payment Not Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>The payment was not completed successfully.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card className="shadow-lg bg-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-green-800">
                  {(paymentResult.amount / 100).toLocaleString()} TZS
                </p>
                <p className="text-sm text-green-600">
                  Paid via {paymentResult.paymentMethod.replace('_', ' ')}
                </p>
              </div>

              {paymentResult.session ? (
                // Direct internet access
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Package</span>
                    <span className="text-sm text-gray-600">{paymentResult.session.packageName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Network</span>
                    <span className="text-sm text-gray-600">{paymentResult.session.routerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Expires</span>
                    <span className="text-sm text-gray-600">
                      {new Date(paymentResult.session.expiresAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Wifi className="w-4 h-4" />
                      <span className="text-sm font-medium">Internet Access Active</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      You now have internet access on this device
                    </p>
                  </div>
                </div>
              ) : paymentResult.voucher ? (
                // Voucher generated
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Voucher Code</p>
                    <div className="bg-white p-3 rounded-lg border-2 border-dashed border-green-300">
                      <p className="text-2xl font-mono font-bold text-green-700 tracking-wider">
                        {paymentResult.voucher.code}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Package</span>
                      <span className="text-sm text-gray-600">{paymentResult.voucher.packageName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Valid Until</span>
                      <span className="text-sm text-gray-600">{paymentResult.voucher.validUntil}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => copyVoucherCode(paymentResult.voucher!.code)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => downloadVoucher(paymentResult.voucher)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">How to use your voucher:</p>
                    <ol className="text-xs text-blue-600 space-y-1">
                      <li>1. Connect to the WiFi network</li>
                      <li>2. Open browser and go to captive portal</li>
                      <li>3. Click "Use Voucher" and enter the code</li>
                      <li>4. Enjoy your internet access!</li>
                    </ol>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/')} 
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}