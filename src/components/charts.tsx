"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStrengthSeries, useWeightSeries } from "@/lib/hooks";
import { fmtDate } from "@/lib/utils";
import { EmptyState, Spinner } from "./ui";
import { TrendingUp } from "lucide-react";

const axisProps = {
  stroke: "#26262c",
  tick: { fill: "#9a9aa3", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: "#1c1c1f",
  border: "1px solid #26262c",
  borderRadius: 12,
  fontSize: 12,
  color: "#e9e9ec",
};

function xTick(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function WeightChart({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useWeightSeries(clientId);

  if (isLoading) return <ChartLoader />;
  if (isError)
    return <p className="text-sm text-danger">Could not load weight history.</p>;
  if (!data || data.length < 2)
    return (
      <EmptyState
        icon={<TrendingUp className="h-5 w-5" />}
        title="Not enough data yet"
        hint="Log two or more Body Measurements assessments to see the trend."
      />
    );

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="date"
            tickFormatter={xTick}
            stroke={axisProps.stroke}
            tick={axisProps.tick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            width={44}
            stroke={axisProps.stroke}
            tick={axisProps.tick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => fmtDate(String(label))}
            formatter={(value) => [`${value} kg`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#c6f24e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#c6f24e", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StrengthChart({
  clientId,
  exerciseId,
}: {
  clientId: string;
  exerciseId: string | null;
}) {
  const { data, isLoading, isError } = useStrengthSeries(clientId, exerciseId);

  if (!exerciseId)
    return (
      <p className="py-6 text-center text-sm text-muted">
        Pick an exercise to see its strength curve.
      </p>
    );
  if (isLoading) return <ChartLoader />;
  if (isError)
    return <p className="text-sm text-danger">Could not load strength data.</p>;
  if (!data || data.length < 2)
    return (
      <EmptyState
        icon={<TrendingUp className="h-5 w-5" />}
        title="Not enough data yet"
        hint="Log this exercise in at least two sessions to see the curve."
      />
    );

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="date"
            tickFormatter={xTick}
            stroke={axisProps.stroke}
            tick={axisProps.tick}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            width={44}
            stroke={axisProps.stroke}
            tick={axisProps.tick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => fmtDate(String(label))}
            formatter={(value) => [`${value} kg`, "Top set"]}
          />
          <Line
            type="monotone"
            dataKey="maxKg"
            stroke="#c6f24e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#c6f24e", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLoader() {
  return (
    <div className="flex h-32 items-center justify-center">
      <Spinner />
    </div>
  );
}