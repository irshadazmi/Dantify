import { RelativePathString } from "expo-router";
import IntroTemplate from "./intro-template";

const SecondScreen = () => {
  return (
    <IntroTemplate
      image={require('@/assets/images/dantify-intro2.png')}
      title="Analyze Spending Patterns"
      description="Visualize your expenses with detailed charts and reports."
      next={"/intro/third_screen" as RelativePathString} 
    />
  );
};

export default SecondScreen;