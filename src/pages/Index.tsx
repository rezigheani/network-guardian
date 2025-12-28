import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, LogOut, Router, Activity, Bell } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">NOC Dashboard</h1>
              <p className="text-sm text-muted-foreground">Network Monitoring Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Selamat Datang!</h2>
          <p className="text-muted-foreground">
            Database telah berhasil dikonfigurasi. Berikut fitur yang akan tersedia:
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <div className="p-2 rounded-lg bg-primary/10 w-fit">
                <Router className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">CRUD Router</CardTitle>
              <CardDescription>
                Kelola router: tambah, edit, hapus, dan lihat daftar router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 rounded-lg bg-green-500/10 w-fit">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <CardTitle className="text-lg">Status Monitoring</CardTitle>
              <CardDescription>
                Pantau status UP/DOWN semua router dalam jaringan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 rounded-lg bg-blue-500/10 w-fit">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg">Grafik Real-time</CardTitle>
              <CardDescription>
                Visualisasi bandwidth RX/TX dan sinyal optik secara real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2 rounded-lg bg-orange-500/10 w-fit">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Notifikasi Alert</CardTitle>
              <CardDescription>
                Dapatkan notifikasi saat terjadi gangguan pada jaringan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">✅ Database Status</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Tabel <code className="bg-background px-1 rounded">routers</code> - Siap digunakan</li>
            <li>• Tabel <code className="bg-background px-1 rounded">traffic_logs</code> - Siap digunakan (Realtime enabled)</li>
            <li>• Row Level Security - Aktif untuk authenticated users</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Index;
