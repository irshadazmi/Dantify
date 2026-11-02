import React from "react";
import { View, TextInput } from "react-native";
import { InlineField } from "./inline-field";
import { useStyles } from "@/styles/styles";

type Props = {
  label: string;
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
};

type DateParts = {
  day: string;
  month: string;
  year: string;
};

const EMPTY_DATE: DateParts = {
  day: "",
  month: "",
  year: "",
};

/**
 * Checks whether a YYYY-MM-DD date is a real calendar date.
 * This validates the date without relying on locale-specific parsing.
 */
function isValidDate(year: number, month: number, day: number): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  return day <= daysInMonth;
}

function parseDate(value?: string): DateParts {
  if (!value) {
    return EMPTY_DATE;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return EMPTY_DATE;
  }

  const [, year, month, day] = match;

  if (!isValidDate(Number(year), Number(month), Number(day))) {
    return EMPTY_DATE;
  }

  return { day, month, year };
}

export function InlineDateSpinner({
  label,
  value,
  onChange,
}: Props) {
  const styles = useStyles();

  const [dateParts, setDateParts] = React.useState<DateParts>(
    () => parseDate(value),
  );

  const lastEmittedValue = React.useRef<string | undefined>(value);

  // Synchronize the input fields when the parent changes the date.
  React.useEffect(() => {
    const parsed = parseDate(value);

    setDateParts((current) => {
      if (
        current.day === parsed.day &&
        current.month === parsed.month &&
        current.year === parsed.year
      ) {
        return current;
      }

      return parsed;
    });

    lastEmittedValue.current = value;
  }, [value]);

  const updatePart = React.useCallback(
    (part: keyof DateParts, text: string) => {
      // Accept digits only.
      const digits = text.replace(/\D/g, "");

      setDateParts((current) => {
        const next = {
          ...current,
          [part]: digits,
        };

        return next;
      });
    },
    [],
  );

  // Emit only complete, valid dates. Emit an empty value when all fields
  // are cleared so the parent form can correctly handle an optional date.
  React.useEffect(() => {
    const { day, month, year } = dateParts;

    let nextValue: string | undefined;

    if (!day && !month && !year) {
      nextValue = "";
    } else if (day.length === 2 && month.length === 2 && year.length === 4) {
      const numericDay = Number(day);
      const numericMonth = Number(month);
      const numericYear = Number(year);

      if (isValidDate(numericYear, numericMonth, numericDay)) {
        nextValue = `${year}-${month}-${day}`;
      }
    }

    if (
      nextValue !== undefined &&
      nextValue !== lastEmittedValue.current
    ) {
      lastEmittedValue.current = nextValue;
      onChange(nextValue);
    }
  }, [dateParts, onChange]);

  return (
    <InlineField label={label}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <TextInput
          style={[styles.textInput, { flex: 1, textAlign: "center" }]}
          placeholder="DD"
          accessibilityLabel={`${label}, day`}
          keyboardType="number-pad"
          maxLength={2}
          value={dateParts.day}
          onChangeText={(text) => updatePart("day", text)}
          returnKeyType="next"
        />

        <TextInput
          style={[styles.textInput, { flex: 1, textAlign: "center" }]}
          placeholder="MM"
          accessibilityLabel={`${label}, month`}
          keyboardType="number-pad"
          maxLength={2}
          value={dateParts.month}
          onChangeText={(text) => updatePart("month", text)}
          returnKeyType="next"
        />

        <TextInput
          style={[styles.textInput, { flex: 2, textAlign: "center" }]}
          placeholder="YYYY"
          accessibilityLabel={`${label}, year`}
          keyboardType="number-pad"
          maxLength={4}
          value={dateParts.year}
          onChangeText={(text) => updatePart("year", text)}
          returnKeyType="done"
        />
      </View>
    </InlineField>
  );
}