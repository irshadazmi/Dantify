// mobile-app/src/components/ui/inline-field.tsx
import { Text, View } from "react-native";
import { useStyles } from "@/styles/styles";

export const InlineField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const styles = useStyles();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
      }}
    >
      <Text
        style={[
          styles.label,
          {
            width: 90,
            marginTop: 0,       // 🔑 reset vertical spacing
            paddingBottom: 0,   // 🔑 critical fix
            marginRight: 8,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

// import React from "react";
// import { Text, View } from "react-native";
// import { useStyles } from "@/styles/styles";
// import { useAppColors } from "@/hooks/use-app-colors";

// export const InlineField = ({
//   label,
//   children,
// }: {
//   label: string;
//   children: React.ReactNode;
// }) => {
//   const styles = useStyles();
//   const COLORS = useAppColors();

//   return (
//     <View style={{ marginBottom: 18 }}>
//       <View
//         style={{
//           position: "relative",
//           borderWidth: 1.5,
//           borderColor: COLORS.primary, // 👈 matches image
//           borderRadius: 5,
//           backgroundColor: COLORS.card,
//           paddingTop: 10, // space for label
//           paddingHorizontal: 14,
//           paddingBottom: 10,
//         }}
//       >
//         {/* FLOATING LABEL */}
//         <Text
//           style={[
//             styles.label,
//             {
//               position: "absolute",
//               top: -20,
//               left: 12,
//               paddingHorizontal: 8,
//               backgroundColor: COLORS.surface, // 👈 masks border
//               fontSize: 13,
//               fontWeight: "500",
//               color: COLORS.primary,
//               zIndex: 10,
//             },
//           ]}
//         >
//           {label}
//         </Text>

//         {/* INPUT SLOT */}
//         <View
//           style={{
//             minHeight: 44,
//             justifyContent: "center",
//           }}
//         >
//           {children}
//         </View>
//       </View>
//     </View>
//   );
// };

