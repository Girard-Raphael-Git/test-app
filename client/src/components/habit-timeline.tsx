import { Habit, Entry } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HabitTimelineProps {
  habits: Habit[];
}

export default function HabitTimeline({ habits }: HabitTimelineProps) {
  const { data: entries } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
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
                    {format(date, "EEE")}
                  </div>
                  {getCompletionStatus(habit, date) ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
