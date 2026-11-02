// src/app/intro/intro-template.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import { useRouter, RelativePathString } from "expo-router";

import { useStyles } from "@/styles/styles";

interface IntroTemplateProps {
  image: ImageSourcePropType;
  title: string;
  description: string;
  next: RelativePathString | (() => void); // ✅ FIXED
}

const IntroTemplate: React.FC<IntroTemplateProps> = ({
  image,
  title,
  description,
  next,
}) => {
  const styles = useStyles();
  const router = useRouter();

  const handleNext = () => {
    if (typeof next === "function") {
      next();
    } else {
      // ✅ Now TS knows this is a valid route
      router.replace(next);
    }
  };

  return (
    <View style={[styles.container, {justifyContent: "center"}]}>
      <Image
        source={image}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.description}>
        {description}
      </Text>

      <Pressable
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
    </View>
  );
};

export default IntroTemplate;
