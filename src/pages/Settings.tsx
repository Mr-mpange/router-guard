import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Save,
} from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your system preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Portal Settings</h2>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="portal-name">Portal Name</Label>
                    <Input
                      id="portal-name"
                      defaultValue="NetFlow WiFi"
                      placeholder="Your WiFi network name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="welcome-msg">Welcome Message</Label>
                    <Input
                      id="welcome-msg"
                      defaultValue="Welcome to our WiFi network"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      defaultValue="support@netflow.co.tz"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h2 className="text-lg font-semibold mb-4">Network Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-disconnect on expiry</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically disconnect users when their session expires
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow MAC binding</Label>
                      <p className="text-sm text-muted-foreground">
                        Bind sessions to device MAC addresses
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable bandwidth limits</Label>
                      <p className="text-sm text-muted-foreground">
                        Apply speed limits based on package type
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Router offline alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a router goes offline
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for new payments
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily summary reports via email
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low balance alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when voucher stock is running low
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-factor authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all user session activities
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>MAC spoofing protection</Label>
                    <p className="text-sm text-muted-foreground">
                      Detect and block MAC address spoofing attempts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-medium mb-4">Change Admin Password</h3>
                <div className="grid gap-4 max-w-md">
                  <div className="grid gap-2">
                    <Label htmlFor="current-pw">Current Password</Label>
                    <Input id="current-pw" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-pw">New Password</Label>
                    <Input id="new-pw" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-pw">Confirm New Password</Label>
                    <Input id="confirm-pw" type="password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Update Security
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Payment Gateway Configuration</h2>
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Globe className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">M-Pesa Integration</h3>
                        <p className="text-sm text-muted-foreground">Vodacom M-Pesa</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>API Key</Label>
                      <Input type="password" defaultValue="••••••••••••" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Secret Key</Label>
                      <Input type="password" defaultValue="••••••••••••" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Globe className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Tigo Pesa Integration</h3>
                        <p className="text-sm text-muted-foreground">Tigo Mobile Money</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>API Key</Label>
                      <Input type="password" defaultValue="••••••••••••" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Secret Key</Label>
                      <Input type="password" defaultValue="••••••••••••" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <Globe className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Airtel Money Integration</h3>
                        <p className="text-sm text-muted-foreground">Airtel Mobile Money</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Payment Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
