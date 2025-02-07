import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminNav from "@/components/admin-nav";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Notification, User } from "@shared/schema";

interface NotificationWithUser extends Notification {
  user?: User;
}

export default function AdminNotifications() {
  const { data: notifications, isLoading: notificationsLoading } = useQuery<
    NotificationWithUser[]
  >({
    queryKey: ["/api/admin/notifications"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  if (notificationsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const connectedUsers = users?.filter((user) => user.telegramId) || [];
  const pendingNotifications =
    notifications?.filter((notification) => !notification.sent) || [];

  return (
    <div className="flex">
      <AdminNav />
      <main className="flex-1 p-8 space-y-8">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Connected Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="font-medium">{user.username}</div>
                    <Badge variant="success">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Connected
                    </Badge>
                  </div>
                ))}
                {connectedUsers.length === 0 && (
                  <p className="text-muted-foreground">
                    No users have connected their Telegram accounts yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{notification.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(notification.createdAt), "PPpp")}
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
                {pendingNotifications.length === 0 && (
                  <p className="text-muted-foreground">
                    No pending notifications.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications?.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Badge variant="outline">{notification.type}</Badge>
                    </TableCell>
                    <TableCell>{notification.message}</TableCell>
                    <TableCell>
                      {users?.find((u) => u.id === notification.userId)?.username}
                    </TableCell>
                    <TableCell>
                      {format(new Date(notification.createdAt), "PP")}
                    </TableCell>
                    <TableCell>
                      {notification.sent ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-4 h-4 mr-2" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
