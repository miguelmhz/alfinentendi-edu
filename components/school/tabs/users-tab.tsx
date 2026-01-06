"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
  status: string;
  lastLogin: string | null;
  bookAccesses: any[];
}

interface UsersTabProps {
  users: User[];
  isAdmin: boolean;
  onAddStudent: () => void;
  onAssignBook: (student: { id: string; name: string }) => void;
}

export function UsersTab({
  users,
  isAdmin,
  onAddStudent,
  onAssignBook,
}: UsersTabProps) {
  const [filterRole, setFilterRole] = useState<string>("all");

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (roles: string[]) => {
    if (roles.includes("COORDINATOR")) return "default";
    if (roles.includes("TEACHER")) return "secondary";
    return "outline";
  };

  const getRoleLabel = (roles: string[]) => {
    if (roles.includes("COORDINATOR")) return "Coordinador";
    if (roles.includes("TEACHER")) return "Profesor";
    if (roles.includes("STUDENT")) return "Estudiante";
    return "Usuario";
  };

  const filteredUsers = (() => {
    if (filterRole === "all") return users;
    if (filterRole === "students")
      return users.filter((u) => u.roles.includes("STUDENT"));
    if (filterRole === "teachers")
      return users.filter((u) => u.roles.includes("TEACHER"));
    if (filterRole === "coordinators")
      return users.filter((u) => u.roles.includes("COORDINATOR"));
    return users;
  })();

  const students = users.filter((u) => u.roles.includes("STUDENT"));
  const teachers = users.filter((u) => u.roles.includes("TEACHER"));
  const coordinators = users.filter((u) => u.roles.includes("COORDINATOR"));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            {students.length} estudiante{students.length !== 1 ? "s" : ""},{" "}
            {teachers.length} profesor{teachers.length !== 1 ? "es" : ""},{" "}
            {coordinators.length} coordinador
            {coordinators.length !== 1 ? "es" : ""}
          </CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={onAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Estudiante
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Button
            variant={filterRole === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("all")}
          >
            Todos ({users.length})
          </Button>
          <Button
            variant={filterRole === "students" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("students")}
          >
            Estudiantes ({students.length})
          </Button>
          <Button
            variant={filterRole === "teachers" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("teachers")}
          >
            Profesores ({teachers.length})
          </Button>
          <Button
            variant={filterRole === "coordinators" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("coordinators")}
          >
            Coordinadores ({coordinators.length})
          </Button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay usuarios en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isStudent = user.roles.includes("STUDENT");
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {user.name || user.email}
                        </p>
                        <Badge variant={getRoleBadgeVariant(user.roles)}>
                          {getRoleLabel(user.roles)}
                        </Badge>
                        {user.status === "INVITED" && (
                          <Badge variant="outline">Invitado</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {isStudent && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {user.bookAccesses?.length || 0} libro
                            {user.bookAccesses?.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isStudent && isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onAssignBook({
                            id: user.id,
                            name: user.name || user.email,
                          })
                        }
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Asignar Libro
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
