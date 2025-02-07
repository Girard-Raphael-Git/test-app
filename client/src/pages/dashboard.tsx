import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { Habit } from "@shared/schema";
import HabitForm from "@/components/habit-form";
import HabitTimeline from "@/components/habit-timeline";
import HabitStats from "@/components/habit-stats";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {user?.username}!</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <HabitForm />
          </DialogContent>
        </Dialog>
      </div>

      {habits?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              You haven't created any habits yet. Click "New Habit" to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Timeline</h2>
                <HabitTimeline habits={habits || []} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                <HabitStats habits={habits || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
