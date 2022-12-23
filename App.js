import React, { useState, useContext, useEffect } from 'react';
import { AuthenticatedUserContext } from './Context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from './config/firebase';
import Login from './screens/Login';
import ChatList from './screens/ChatList';
import Chat from './screens/Chat';
import Home from './screens/Home';
import Notifications from './screens/Notifications';
import {
  collection,
  query,
  getDocs,
  where,
} from 'firebase/firestore';

const Stack = createStackNavigator();

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [prevScreen, setPrevScreen] = useState("");
  const [spotifyCode, setSpotifyCode] = useState("");

  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser, authUser, setAuthUser, prevScreen, setPrevScreen, spotifyCode, setSpotifyCode }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};

function ChatStack() {
  return (
    <Stack.Navigator defaultScreenOptions={Home}>
      <Stack.Screen name='Home' component={Home} />
      <Stack.Screen name='ChatList' component={ChatList} />
      <Stack.Screen name='Notifications' component={Notifications} />
      <Stack.Screen name='Chat' component={Chat} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} defaultScreenOptions={Login}>
      <Stack.Screen name='Login' component={Login} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser, authUser, setAuthUser } = useContext(AuthenticatedUserContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscriber
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async authenticatedUser => {
        if(authenticatedUser) {
          const collectionRef = collection(database, 'users'); // show more recently created profiles at top
          const userQuery = query(collectionRef, where('email', '==', authenticatedUser.email));
          const userQuerySnapshot = await getDocs(userQuery);
          setAuthUser(authenticatedUser);
          console.log(userQuerySnapshot.docs[0].data());
          setUser({id: userQuerySnapshot.docs[0].id, ...userQuerySnapshot.docs[0].data()});
        } else {
          setUser(null);
          setAuthUser(null);
        }
        setLoading(false);
      }
    );
    // unsubscribe auth listener on unmount
    return () => unsubscribeAuth;
  }, [authUser]);
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <ChatStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthenticatedUserProvider>
      <RootNavigator />
    </AuthenticatedUserProvider>
  )
}