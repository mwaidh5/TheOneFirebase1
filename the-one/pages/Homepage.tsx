import React from 'react';
import { Capacitor } from '@capacitor/core';
import { User } from '../types';
import AppHome from './AppHome';
import MarketingHome from './MarketingHome';

interface HomepageProps {
  currentUser?: User | null;
  settings: {
    heroImage: string;
    missionImage: string;
    heroHeadline: string;
    heroSubline: string;
  };
}

// In the installed native app → app-style home. In any browser → full website home.
const Homepage: React.FC<HomepageProps> = (props) =>
  Capacitor.isNativePlatform() ? <AppHome {...props} /> : <MarketingHome {...props} />;

export default Homepage;
