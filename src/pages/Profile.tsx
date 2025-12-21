import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, User, Mail, Briefcase, Target, Award } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { StatCard } from "@/components/ui/StatCard";
import { GradientButton } from "@/components/ui/GradientButton";

const JOB_ROLES = ["Software Developer", "AI/ML", "Embedded Systems"];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    preferred_role: "Software Developer",
  });
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        preferred_role: data.preferred_role || "Software Developer",
      });
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;
    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", true);
    
    if (sessions) {
      const avgScore = sessions.length > 0 
        ? sessions.reduce((a, b) => a + Number(b.average_score), 0) / sessions.length 
        : 0;
      setStats({
        totalInterviews: sessions.length,
        averageScore: avgScore,
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        preferred_role: profile.preferred_role,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-page flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-page">
      <PageHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          {/* Profile Info */}
          <AnimatedCard delay={50}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg gradient-brand-light">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 h-11 bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Preferred Job Role</Label>
                <Select
                  value={profile.preferred_role}
                  onValueChange={(value) => setProfile({ ...profile, preferred_role: value })}
                >
                  <SelectTrigger className="h-11">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <GradientButton onClick={handleSave} loading={saving} className="w-full" icon={<Save className="w-4 h-4" />}>
                Save Changes
              </GradientButton>
            </CardContent>
          </AnimatedCard>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Total Interviews"
              value={stats.totalInterviews}
              icon={Target}
              iconColor="text-primary"
              delay={100}
            />
            <StatCard
              title="Average Score"
              value={`${stats.averageScore.toFixed(1)}/10`}
              icon={Award}
              iconColor="text-warning"
              delay={150}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
