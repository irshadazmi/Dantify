import { RelativePathString } from "expo-router";
import IntroTemplate from "./intro-template";

const ThirdScreen = () => {
  return (
    <IntroTemplate
      image={require('@/assets/images/dantify-intro3.png')}
      title="Forecast Future Expenses"
      description="Plan ahead with predictions based on your spending history."
      next={"/intro/fourth_screen" as RelativePathString} 
    />
  );
};

export default ThirdScreen;

