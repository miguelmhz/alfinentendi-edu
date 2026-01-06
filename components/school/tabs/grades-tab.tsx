"use client";

import { useState } from "react";
import {
  GraduationCap,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
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
  studentGroups: Array<{
    group: {
      id: string;
      gradeId: string;
    };
  }>;
}

interface Grade {
  id: string;
  name: string;
  level?: string;
  groups: Array<{
    id: string;
    name: string;
    teacher?: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

interface GradesTabProps {
  grades: Grade[];
  users: User[];
  onAddGrade: () => void;
  onDeleteGrade: (gradeId: string) => void;
  onAddGroup: (gradeId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAssignStudentsToGrade: (grade: { id: string; name: string }) => void;
  onAssignStudentsToGroup: (group: {
    id: string;
    name: string;
    gradeId: string;
  }) => void;
  onAssignTeacherToGroup: (group: {
    id: string;
    name: string;
    teacherId: string | null;
  }) => void;
}

export function GradesTab({
  grades,
  users,
  onAddGrade,
  onDeleteGrade,
  onAddGroup,
  onDeleteGroup,
  onAssignStudentsToGrade,
  onAssignStudentsToGroup,
  onAssignTeacherToGroup,
}: GradesTabProps) {
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());

  const toggleGradeExpansion = (gradeId: string) => {
    setExpandedGrades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gradeId)) {
        newSet.delete(gradeId);
      } else {
        newSet.add(gradeId);
      }
      return newSet;
    });
  };

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Grados Escolares</CardTitle>
          <CardDescription>
            Gestiona los grados y grupos de la escuela
          </CardDescription>
        </div>
        <Button onClick={onAddGrade}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Grado
        </Button>
      </CardHeader>
      <CardContent>
        {grades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No hay grados registrados</p>
            <Button variant="outline" onClick={onAddGrade}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer grado
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {grades.map((grade) => {
              const isExpanded = expandedGrades.has(grade.id);
              const gradeStudents = users.filter(
                (u) =>
                  u.roles.includes("STUDENT") &&
                  u.studentGroups.some((sg) => sg.group.gradeId === grade.id)
              );

              return (
                <div key={grade.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleGradeExpansion(grade.id)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="font-semibold">{grade.name}</div>
                        {grade.level && (
                          <div className="text-sm text-muted-foreground">
                            {grade.level}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {grade.groups.length} grupo
                        {grade.groups.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onAssignStudentsToGrade({
                            id: grade.id,
                            name: grade.name,
                          })
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Asignar Estudiantes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddGroup(grade.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Grupo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteGrade(grade.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t">
                      {grade.groups.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="mb-2">No hay grupos en este grado</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddGroup(grade.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar primer grupo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 p-4">
                          {gradeStudents.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold mb-2">
                                Estudiantes en este grado ({gradeStudents.length})
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {gradeStudents.map((student) => (
                                  <div
                                    key={student.id}
                                    className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(student.name, student.email)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {student.name || student.email}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-muted/20">
                                <tr>
                                  <th className="text-left p-3 font-medium text-sm">
                                    Nombre del Grupo
                                  </th>
                                  <th className="text-left p-3 font-medium text-sm">
                                    Profesor
                                  </th>
                                  <th className="text-left p-3 font-medium text-sm">
                                    Estudiantes
                                  </th>
                                  <th className="text-right p-3 font-medium text-sm">
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {grade.groups.map((group) => {
                                  const groupStudents = users.filter(
                                    (u) =>
                                      u.roles.includes("STUDENT") &&
                                      u.studentGroups.some(
                                        (sg) => sg.group.id === group.id
                                      )
                                  );

                                  return (
                                    <tr
                                      key={group.id}
                                      className="border-t hover:bg-muted/10"
                                    >
                                      <td className="p-3">
                                        <div className="font-medium">
                                          {group.name}
                                        </div>
                                        {groupStudents.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {groupStudents
                                              .slice(0, 3)
                                              .map((student) => (
                                                <Avatar
                                                  key={student.id}
                                                  className="h-5 w-5"
                                                >
                                                  <AvatarFallback className="text-[10px]">
                                                    {getInitials(
                                                      student.name,
                                                      student.email
                                                    )}
                                                  </AvatarFallback>
                                                </Avatar>
                                              ))}
                                            {groupStudents.length > 3 && (
                                              <span className="text-xs text-muted-foreground">
                                                +{groupStudents.length - 3}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        {group.teacher ? (
                                          <div>
                                            <div className="font-medium text-sm">
                                              {group.teacher.name || "Sin nombre"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {group.teacher.email}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground italic text-sm">
                                            Sin asignar
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <Badge variant="secondary">
                                          {groupStudents.length} estudiante
                                          {groupStudents.length !== 1 ? "s" : ""}
                                        </Badge>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              onAssignTeacherToGroup({
                                                id: group.id,
                                                name: group.name,
                                                teacherId: group.teacher?.id || null,
                                              })
                                            }
                                            title="Asignar profesor"
                                          >
                                            <GraduationCap className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              onAssignStudentsToGroup({
                                                id: group.id,
                                                name: group.name,
                                                gradeId: grade.id,
                                              })
                                            }
                                            title="Asignar estudiantes"
                                          >
                                            <Users className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteGroup(group.id)}
                                            title="Eliminar grupo"
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
