"use client";

import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookLicense {
  id: string;
  book: {
    id: string;
    title: string;
    subject?: string;
  };
  totalLicenses: number;
  usedLicenses: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface BooksTabProps {
  bookLicenses: BookLicense[];
  isAdmin: boolean;
  onAddLicense: () => void;
  onEditLicense: (license: BookLicense) => void;
  onViewStudents: (license: BookLicense) => void;
}

export function BooksTab({
  bookLicenses,
  isAdmin,
  onAddLicense,
  onEditLicense,
  onViewStudents,
}: BooksTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Licencias de Libros</CardTitle>
          <CardDescription>
            {bookLicenses.length} licencia{bookLicenses.length !== 1 ? "s" : ""}{" "}
            asignada{bookLicenses.length !== 1 ? "s" : ""}
          </CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={onAddLicense}>
            <Plus className="mr-2 h-4 w-4" />
            Asignar Licencia
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {bookLicenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No hay licencias de libros asignadas</p>
            {isAdmin && (
              <Button onClick={onAddLicense}>Asignar primera licencia</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookLicenses.map((license) => (
              <div
                key={license.id}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => onViewStudents(license)}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{license.book.title}</h4>
                  {license.book.subject && (
                    <p className="text-sm text-muted-foreground">
                      {license.book.subject}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      <strong>Licencias:</strong> {license.usedLicenses} /{" "}
                      {license.totalLicenses}
                    </span>
                    <span>
                      <strong>Disponibles:</strong>{" "}
                      {license.totalLicenses - license.usedLicenses}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>
                      Inicio: {new Date(license.startDate).toLocaleDateString()}
                    </span>
                    <span>
                      Expiración:{" "}
                      {new Date(license.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={license.isActive ? "default" : "secondary"}>
                    {license.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLicense(license);
                      }}
                    >
                      Editar Licencia
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
