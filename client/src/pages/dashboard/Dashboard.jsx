import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { UserCheck, ShieldCheck } from "lucide-react";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <AdminLayout title="EduSphere General Portal">
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome, {user.name || "User"}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs mb-6">
          <p><strong>Account Role:</strong> <span className="text-purple-600 font-bold">{user.role || "User"}</span></p>
          <p><strong>Platform Status:</strong> <span className="text-emerald-600 font-bold">Active</span></p>
        </div>

        <Button
          variant="danger"
          size="md"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
        >
          Sign Out
        </Button>
      </Card>
    </AdminLayout>
  );
}

export default Dashboard;