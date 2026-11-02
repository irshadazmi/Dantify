import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import IntroTemplate from "./intro-template";

const FourthScreen = () => {
  const router = useRouter();

  const handleNext = async () => {
    await AsyncStorage.setItem('hasSeenIntro', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <IntroTemplate
      image={require('@/assets/images/dantify-intro4.png')}
      title="AI Assistance"
      description="Get smart insights and guidance powered by LangChain/Ollama"
      next={handleNext}
    />
  );
};

export default FourthScreen;
