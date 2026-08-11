'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  User,
  Loader2,
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

type ActionType = 'checkin' | 'checkout' | 'breakin' | 'breakout';

export default function CheckInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [action, setAction] = useState<ActionType>('checkin');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [note, setNote] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  const fetchTodayAttendance = async () => {
    if (!employeeId) return;
    try {
      const response = await api.get('/attendance/today', {
        params: { employeeId },
      });
      const data = response.data.data;
      setTodayAttendance(data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchTodayAttendance();
    }
  }, [employeeId]);

  const getCurrentLocation = () => {
    setCheckingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setCheckingLocation(false);
          toast({
            title: 'Location captured',
            description: 'Your location has been recorded',
          });
        },
        (error) => {
          setCheckingLocation(false);
          toast({
            title: 'Location error',
            description: 'Unable to get your location. Please enable GPS.',
            variant: 'destructive',
          });
        }
      );
    } else {
      setCheckingLocation(false);
      toast({
        title: 'Not supported',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
    }
  };

  const handleCapturePhoto = () => {
    // In production, this would open camera
    // For demo, we'll use a placeholder
    setPhoto('placeholder-photo-url');
    toast({
      title: 'Photo captured',
      description: 'Your photo has been captured successfully',
    });
  };

  const handleSubmit = async () => {
    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        employeeId,
        note,
        photo,
        ...(location && {
          latitude: location.lat.toString(),
          longitude: location.lng.toString(),
        }),
      };

      let endpoint = '';
      let successMessage = '';

      switch (action) {
        case 'checkin':
          endpoint = '/attendance/check-in';
          successMessage = 'Check-in successful';
          break;
        case 'checkout':
          endpoint = '/attendance/check-out';
          successMessage = 'Check-out successful';
          break;
        case 'breakin':
          endpoint = '/attendance/break-in';
          successMessage = 'Break started';
          break;
        case 'breakout':
          endpoint = '/attendance/break-out';
          successMessage = 'Break ended';
          break;
      }

      await api.post(endpoint, payload);
      toast({
        title: 'Success',
        description: successMessage,
      });
      await fetchTodayAttendance();
      setNote('');
      setPhoto(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = () => {
    switch (action) {
      case 'checkin':
        return 'Check In';
      case 'checkout':
        return 'Check Out';
      case 'breakin':
        return 'Break In';
      case 'breakout':
        return 'Break Out';
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'checkin':
        return <LogIn className="h-5 w-5" />;
      case 'checkout':
        return <LogOut className="h-5 w-5" />;
      case 'breakin':
        return <Coffee className="h-5 w-5" />;
      case 'breakout':
        return <Coffee className="h-5 w-5" />;
    }
  };

  const isActionDisabled = () => {
    if (!todayAttendance) return action === 'checkout' || action === 'breakin' || action === 'breakout';
    if (action === 'checkin') return todayAttendance.checkIn !== null;
    if (action === 'checkout') return todayAttendance.checkOut !== null;
    if (action === 'breakin') return todayAttendance.breakIn !== null;
    if (action === 'breakout') return !todayAttendance.breakIn || todayAttendance.breakOut !== null;
    return false;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Action</h1>
          <p className="text-muted-foreground">
            Record your attendance with check-in, check-out, and breaks
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Record Attendance</CardTitle>
              <CardDescription>
                Select an action and complete the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['checkin', 'checkout', 'breakin', 'breakout'] as ActionType[]).map((act) => (
                    <Button
                      key={act}
                      variant={action === act ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAction(act)}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      {act === 'checkin' && <LogIn className="h-4 w-4" />}
                      {act === 'checkout' && <LogOut className="h-4 w-4" />}
                      {act === 'breakin' && <Coffee className="h-4 w-4" />}
                      {act === 'breakout' && <Coffee className="h-4 w-4" />}
                      <span className="text-xs">
                        {act === 'checkin' && 'Check In'}
                        {act === 'checkout' && 'Check Out'}
                        {act === 'breakin' && 'Break In'}
                        {act === 'breakout' && 'Break Out'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Populate with employees from API */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={checkingLocation}
                  >
                    {checkingLocation ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="mr-2 h-4 w-4" />
                    )}
                    Get Location
                  </Button>
                  {location && (
                    <span className="text-xs text-muted-foreground flex items-center">
                      ✓ {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCapturePhoto}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
                {photo && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ✓ Photo captured
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  placeholder="Add a note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || !employeeId || isActionDisabled()}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  getActionIcon()
                )}
                {loading ? 'Processing...' : getActionLabel()}
              </Button>

              {isActionDisabled() && employeeId && (
                <Alert>
                  <AlertDescription>
                    This action has already been performed for today
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>
                Current status for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!employeeId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p>Select an employee to view attendance</p>
                </div>
              ) : !todayAttendance ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p>No attendance record for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Status</span>
                    <span className="text-sm">
                      {todayAttendance.checkIn ? (
                        <span className="text-green-600">Checked In</span>
                      ) : (
                        <span className="text-gray-500">Not Checked In</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Check In</span>
                    <span className="text-sm">
                      {todayAttendance.checkIn ? formatDateTime(todayAttendance.checkIn) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Check Out</span>
                    <span className="text-sm">
                      {todayAttendance.checkOut ? formatDateTime(todayAttendance.checkOut) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Break</span>
                    <span className="text-sm">
                      {todayAttendance.breakIn ? (
                        todayAttendance.breakOut ? (
                          'Completed'
                        ) : (
                          'On Break'
                        )
                      ) : (
                        'Not Started'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Hours</span>
                    <span className="text-sm">
                      {todayAttendance.totalHours || '—'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTodayAttendance}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}