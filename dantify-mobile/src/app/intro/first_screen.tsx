// src/app/intro/first_screen.tsx

import IntroTemplate from "./intro-template";
import { RelativePathString } from "expo-router";

const FirstScreen = () => {
  return (
    <IntroTemplate
      image={require("@/assets/images/dantify-intro1.png")}
      title="Track Your Expenses"
      description="Monitor your spending habits and stay in control."
      next={"/intro/second_screen" as RelativePathString} 
    />
  );
};

export default FirstScreen;
