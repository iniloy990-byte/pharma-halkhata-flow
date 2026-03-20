import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Shield, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  user_id: string;
  role: string;
  full_name: string;
}

export default function ManageUsersPage() {
  const { isAdmin, signUp } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");

    if (roles && profiles) {
      const merged = roles.map((r) => ({
        ...r,
        full_name: profiles.find((p) => p.user_id === r.user_id)?.full_name || "Unknown",
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return toast.error("Only admins can create users");
    setCreating(true);
    const { error } = await signUp(email, password, fullName, role);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`${role} account created for ${email}`);
      setEmail("");
      setPassword("");
      setFullName("");
      setTimeout(fetchUsers, 1000);
    }
    setCreating(false);
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">You don't have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px]">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Manage Users</h2>
        <p className="text-xs md:text-sm text-muted-foreground">Create and manage admin & staff accounts</p>
      </div>

      {/* Create user form */}
      <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Create New User
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "staff")}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create User"}
        </Button>
      </form>

      {/* User list */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
        <h3 className="font-semibold text-foreground mb-3">Current Users</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  {u.role === "admin" ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
