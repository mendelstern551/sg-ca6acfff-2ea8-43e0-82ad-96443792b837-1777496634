import React from "react";
import { Calendar, FileText, DollarSign, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface InsightItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

interface QuickInsightsProps {
  insights: InsightItem[];
}

export function QuickInsights({ insights }: QuickInsightsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {insights.map((insight, index) => (
        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">{insight.label}</p>
              <p className="font-semibold text-lg truncate">{insight.value}</p>
              {insight.subtext && (
                <p className="text-xs text-muted-foreground mt-1">{insight.subtext}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function createInsight(
  icon: React.ReactNode,
  label: string,
  value: string,
  subtext?: string
): InsightItem {
  return { icon, label, value, subtext };
}