import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useRouters } from "@/hooks/useRouters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Router, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type RouterType = Tables<"routers">;

interface RouterFormData {
  name: string;
  ip_address: string;
  community_string: string;
  oid_interface_in: string;
  oid_interface_out: string;
  oid_sfp_rx: string;
}

const initialFormData: RouterFormData = {
  name: "",
  ip_address: "",
  community_string: "public",
  oid_interface_in: "",
  oid_interface_out: "",
  oid_sfp_rx: "",
};

const Devices = () => {
  const { routers, loading, addRouter, updateRouter, deleteRouter } = useRouters();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<RouterType | null>(null);
  const [deletingRouter, setDeletingRouter] = useState<RouterType | null>(null);
  const [formData, setFormData] = useState<RouterFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingRouter(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (router: RouterType) => {
    setEditingRouter(router);
    setFormData({
      name: router.name,
      ip_address: router.ip_address,
      community_string: router.community_string,
      oid_interface_in: router.oid_interface_in || "",
      oid_interface_out: router.oid_interface_out || "",
      oid_sfp_rx: router.oid_sfp_rx || "",
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (router: RouterType) => {
    setDeletingRouter(router);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingRouter) {
        await updateRouter(editingRouter.id, {
          name: formData.name,
          ip_address: formData.ip_address,
          community_string: formData.community_string,
          oid_interface_in: formData.oid_interface_in || null,
          oid_interface_out: formData.oid_interface_out || null,
          oid_sfp_rx: formData.oid_sfp_rx || null,
        });
        toast.success("Router berhasil diupdate");
      } else {
        await addRouter({
          name: formData.name,
          ip_address: formData.ip_address,
          community_string: formData.community_string,
          oid_interface_in: formData.oid_interface_in || null,
          oid_interface_out: formData.oid_interface_out || null,
          oid_sfp_rx: formData.oid_sfp_rx || null,
          status: "DOWN",
        });
        toast.success("Router berhasil ditambahkan");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRouter) return;

    try {
      await deleteRouter(deletingRouter.id);
      toast.success("Router berhasil dihapus");
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus router");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Devices</h1>
            <p className="text-muted-foreground">
              Kelola router dan konfigurasi OID untuk monitoring
            </p>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Router
          </Button>
        </div>

        {/* Router List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Router className="h-5 w-5 text-primary" />
              Daftar Router
            </CardTitle>
            <CardDescription>
              {routers.length} router terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : routers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Belum ada router terdaftar</p>
                <p className="text-sm mt-1">
                  Klik tombol "Tambah Router" untuk menambahkan
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Community</TableHead>
                      <TableHead>OID In</TableHead>
                      <TableHead>OID Out</TableHead>
                      <TableHead>OID SFP</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routers.map((router) => (
                      <TableRow key={router.id} className="border-border">
                        <TableCell>
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                              router.status === "UP"
                                ? "bg-status-up/10 text-status-up"
                                : "bg-status-down/10 text-status-down"
                            )}
                          >
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                router.status === "UP"
                                  ? "bg-status-up"
                                  : "bg-status-down"
                              )}
                            />
                            {router.status}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {router.name}
                        </TableCell>
                        <TableCell>{router.ip_address}</TableCell>
                        <TableCell>{router.community_string}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {router.oid_interface_in || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {router.oid_interface_out || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {router.oid_sfp_rx || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(router)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleOpenDelete(router)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRouter ? "Edit Router" : "Tambah Router"}
              </DialogTitle>
              <DialogDescription>
                {editingRouter
                  ? "Update informasi router dan OID"
                  : "Masukkan informasi router baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Router</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Router Utama"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ip_address">IP Address</Label>
                    <Input
                      id="ip_address"
                      value={formData.ip_address}
                      onChange={(e) =>
                        setFormData({ ...formData, ip_address: e.target.value })
                      }
                      placeholder="192.168.1.1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community_string">Community String</Label>
                  <Input
                    id="community_string"
                    value={formData.community_string}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        community_string: e.target.value,
                      })
                    }
                    placeholder="public"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-3">OID Configuration</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="oid_interface_in">
                        OID Interface In (RX/Download)
                      </Label>
                      <Input
                        id="oid_interface_in"
                        value={formData.oid_interface_in}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            oid_interface_in: e.target.value,
                          })
                        }
                        placeholder=".1.3.6.1.2.1.2.2.1.10.1"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oid_interface_out">
                        OID Interface Out (TX/Upload)
                      </Label>
                      <Input
                        id="oid_interface_out"
                        value={formData.oid_interface_out}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            oid_interface_out: e.target.value,
                          })
                        }
                        placeholder=".1.3.6.1.2.1.2.2.1.16.1"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oid_sfp_rx">OID SFP RX (Optical Power)</Label>
                      <Input
                        id="oid_sfp_rx"
                        value={formData.oid_sfp_rx}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            oid_sfp_rx: e.target.value,
                          })
                        }
                        placeholder=".1.3.6.1.4.1.14988.1.1.19.1.1.2.1"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingRouter ? "Update" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Router?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus router "{deletingRouter?.name}"?
                Semua data traffic log router ini juga akan terhapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Devices;
