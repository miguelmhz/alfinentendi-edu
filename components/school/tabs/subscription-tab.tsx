"use client";

import { CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SubscriptionTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscripción</CardTitle>
        <CardDescription>
          Información sobre la suscripción de la escuela
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Información de suscripción próximamente</p>
        </div>
      </CardContent>
    </Card>
  );
}
