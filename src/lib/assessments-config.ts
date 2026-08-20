export interface TestFieldDef {
  key: string;
  label: string;
  unit?: string;
  input: "number" | "text" | "select";
  options?: string[];
}

export interface TestTypeDef {
  id: string;
  label: string;
  fields: TestFieldDef[];
}

export const ASSESSMENT_TEST_TYPES: TestTypeDef[] = [
  {
    id: "body-measurements",
    label: "Body Measurements",
    fields: [
      { key: "weight", label: "Weight", unit: "kg", input: "number" },
      { key: "waist", label: "Waist", unit: "cm", input: "number" },
      { key: "chest", label: "Chest", unit: "cm", input: "number" },
      { key: "arms", label: "Arms", unit: "cm", input: "number" },
      { key: "thighs", label: "Thighs", unit: "cm", input: "number" },
      { key: "bodyFat", label: "Body Fat", unit: "%", input: "number" },
    ],
  },
  {
    id: "vo2max",
    label: "VO2 Max",
    fields: [
      { key: "vo2max", label: "VO2 Max", unit: "ml/kg/min", input: "number" },
    ],
  },
  {
    id: "strength-test",
    label: "Strength Test",
    fields: [
      { key: "exercise", label: "Exercise", input: "text" },
      { key: "oneRm", label: "1RM Weight", unit: "kg", input: "number" },
    ],
  },
  {
    id: "flexibility",
    label: "Flexibility Test",
    fields: [
      {
        key: "sitAndReach",
        label: "Sit and Reach",
        unit: "cm",
        input: "number",
      },
    ],
  },
];

export function getTestTypeDef(id: string): TestTypeDef | undefined {
  return ASSESSMENT_TEST_TYPES.find((t) => t.id === id);
}

export function getTestTypeLabel(id: string): string {
  return getTestTypeDef(id)?.label ?? id;
}