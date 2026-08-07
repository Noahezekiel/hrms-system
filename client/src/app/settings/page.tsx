'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Settings,
  Building2,
  Users,
  Clock,
  Calendar,
  Shield,
  Bell,
  Mail,
  Save,
  Loader2,
  Globe,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [companySettings, setCompanySettings] = useState({
    name: '',
    code: '',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    weekStart: 'Monday',
  });

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      const data = response.data.data;
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      await api.put('/settings/company', companySettings);
      toast({
        title: 'Success',
        description: 'General settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Configure your company information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCode">Company Code</Label>
                    <Input
                      id="companyCode"
                      value={companySettings.code}
                      onChange={(e) => setCompanySettings({ ...companySettings, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={companySettings.timezone}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={companySettings.dateFormat}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, dateFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekStart">Week Start</Label>
                    <Select
                      value={companySettings.weekStart}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, weekStart: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveGeneral} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Settings */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Settings</CardTitle>
                <CardDescription>
                  Configure attendance and time tracking rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Check-in Grace Period</Label>
                      <p className="text-sm text-muted-foreground">
                        Grace period for check-in (minutes)
                      </p>
                    </div>
                    <Input type="number" className="w-32" defaultValue={15} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Check-out Grace Period</Label>
                      <p className="text-sm text-muted-foreground">
                        Grace period for check-out (minutes)
                      </p>
                    </div>
                    <Input type="number" className="w-32" defaultValue={15} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Overtime Threshold</Label>
                      <p className="text-sm text-muted-foreground">
                        Hours per day to qualify for overtime
                      </p>
                    </div>
                    <Input type="number" className="w-32" defaultValue={8} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Location Check-in</Label>
                      <p className="text-sm text-muted-foreground">
                        Require GPS location for check-in
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Photo Check-in</Label>
                      <p className="text-sm text-muted-foreground">
                        Require photo capture for check-in
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Attendance Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Settings */}
          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Settings</CardTitle>
                <CardDescription>
                  Configure leave policies and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maximum Annual Leave</Label>
                      <p className="text-sm text-muted-foreground">
                        Days per year per employee
                      </p>
                    </div>
                    <Input type="number" className="w-32" defaultValue={20} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maximum Sick Leave</Label>
                      <p className="text-sm text-muted-foreground">
                        Days per year per employee
                      </p>
                    </div>
                    <Input type="number" className="w-32" defaultValue={10} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        Require manager approval for leave requests
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Leave Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex items-center gap-2"
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex items-center gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      System
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-blue-600 border-2 border-primary" />
                    <button className="w-8 h-8 rounded-full bg-purple-600" />
                    <button className="w-8 h-8 rounded-full bg-green-600" />
                    <button className="w-8 h-8 rounded-full bg-red-600" />
                    <button className="w-8 h-8 rounded-full bg-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Attendance Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for check-in/out
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Leave Approvals</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notifications for leave requests
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for admin accounts
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">
                        Auto-logout after inactivity (minutes)
                      </p>
                    </div>
                    <Input type="number" className="w-32" defaultValue={30} />
                  </div>
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}