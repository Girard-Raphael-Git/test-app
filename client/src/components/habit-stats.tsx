import { Habit, Entry } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/ui/progress";

interface HabitStatsProps {
  habits: Habit[];
}

export default function HabitStats({ habits }: HabitStatsProps) {
  const { data: entries } = useQuery<Entry[]>({
    queryKey: ["/api/entries"],
  });

  const habitCompletionRates = habits.map((habit) => {
    const habitEntries = entries?.filter((entry) => entry.habitId === habit.id) || [];
    const completionRate = (habitEntries.length / habit.targetCount) * 100;
    
    return {
      name: habit.name,
      completionRate: Math.min(100, completionRate),
    };
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {habits.map((habit) => {
          const habitStats = habitCompletionRates.find(
            (stats) => stats.name === habit.name,
          );

          return (
            <div key={habit.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{habit.name}</span>
                <span className="text-muted-foreground">
                  {Math.round(habitStats?.completionRate || 0)}%
                </span>
              </div>
              <Progress value={habitStats?.completionRate} />
            </div>
          );
        })}
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={habitCompletionRates}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="completionRate"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
