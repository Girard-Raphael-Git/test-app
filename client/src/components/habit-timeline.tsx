import { Habit, Entry } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HabitTimelineProps {
  habits: Habit[];
}

export default function HabitTimeline({ habits }: HabitTimelineProps) {
  const queryClient = useQueryClient();
  const { data: entries } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: Date }) => {
      const existingEntry = entries?.find(
        (entry) =>
          entry.habitId === habitId &&
          format(new Date(entry.completedAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );

      if (existingEntry) {
        await apiRequest("DELETE", `/api/entries/${existingEntry.id}`);
      } else {
        await apiRequest("POST", "/api/entries", {
          habitId,
          completedAt: date.toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    },
  });

  const getCompletionStatus = (habit: Habit, date: Date) => {
    return entries?.some(
      (entry) =>
        entry.habitId === habit.id &&
        format(new Date(entry.completedAt), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd"),
    );
  };

  // Generate last 7 days for timeline
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="space-y-2">
            <div className="font-medium">{habit.name}</div>
            <div className="flex items-center space-x-2">
              {dates.map((date) => (
                <div
                  key={date.toISOString()}
                  className="flex flex-col items-center"
                >
                  <div className="text-xs text-muted-foreground">
                    {format(date, "EEE")
                      .replace("Mon", "Lun")
                      .replace("Tue", "Mar")
                      .replace("Wed", "Mer")
                      .replace("Thu", "Jeu")
                      .replace("Fri", "Ven")
                      .replace("Sat", "Sam")
                      .replace("Sun", "Dim")}
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ habitId: habit.id, date })}
                    disabled={toggleMutation.isPending}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {getCompletionStatus(habit, date) ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
