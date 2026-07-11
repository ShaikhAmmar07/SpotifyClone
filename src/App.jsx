import useStore from './store/useStore';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import MainLayout from './components/MainLayout';
import SoundManager from './components/SoundManager';
import './styles/xp-theme.css';

function App() {
  const appPhase = useStore(s => s.appPhase);

  if (appPhase === 'splash') return <SplashScreen />;
  if (appPhase === 'login') return <LoginScreen />;
  return (
    <SoundManager>
      <MainLayout />
    </SoundManager>
  );
}

export default App;
