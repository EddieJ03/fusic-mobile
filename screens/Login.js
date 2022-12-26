import { StyleSheet, Text, View, Image, SafeAreaView, TouchableOpacity, StatusBar, Alert } from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
const backImage = require("../assets/backgroundImage.png");
import { AuthenticatedUserContext } from '../Context'; 
import React, { useEffect, useContext } from "react";
import { auth, database } from "../config/firebase";
import axios from 'axios'; 
import {
  collection,
  updateDoc,
  addDoc,
  doc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function Login({ navigation }) {
  const { spotifyCode, setSpotifyCode } = useContext(AuthenticatedUserContext);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: '843196be31644a08aa430173df7ca822',
      responseType: ResponseType.Token,
      clientSecret: '56b4929f5cf34d829e812f77b9e39fcd',
      scopes: ['user-read-email', 'user-top-read'],
      usePKCE: false,
      redirectUri: makeRedirectUri({
        scheme: 'exp://10.0.0.5:19000'
      }),
    },
    discovery
  );

  const getSpotifyProfileData = async (access_token) => {
    try {
      const profile = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const topArtists = await axios.get('https://api.spotify.com/v1/me/top/artists?offset=0&limit=3', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        }
      });

      const topSongs = await axios.get('https://api.spotify.com/v1/me/top/tracks?offset=0&limit=3', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        }
      });

      const { email } = profile.data;

      signInWithEmailAndPassword(auth, email, email)
        .then((cred) => {
          const { uid } = cred.user;
          
          updateProfile(uid, profile.data, topArtists.data.items, topSongs.data.items);

          console.log("Login success");
        })
        .catch((err) => {
          console.log("USER DOES NOT EXIST YET");

          if(err.message === 'Firebase: Error (auth/user-not-found).') {
            onHandleSignup(email, email, profile.data, topArtists.data.items, topSongs.data.items);
          } else {
            Alert.alert("Login error", err.message);
          }
        });
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;

      getSpotifyProfileData(access_token);

      setSpotifyCode(access_token);
    }
  }, [response]);

  const onHandleLogin = () => {
    promptAsync();
  };

const updateProfile = async (uid, profile, topArtists, topSongs) => {
  const userQuery = query(collection(database, 'users'), where('_id', '==', uid));
  const userQuerySnapshot = await getDocs(userQuery);
  const profileRef = doc(database, 'users', userQuerySnapshot.docs[0].id);

  updateDoc(profileRef, {
    picture: profile.images.length === 0 ? "" : profile.images[0].url,
    top_artists: topArtists.map((artist) => {
      return {
        name: artist.name,
        picture: artist.images[0].url,
        spotify: artist.external_urls.spotify
      }
    }),
    top_songs: topSongs.map((song) => {
      return {
        name: song.name,
        picture: song.album.images[0].url,
        spotify: song.external_urls.spotify
      }
    }),
    display_name: profile.display_name
  });
}

const onHandleSignup = (email, password, profile, topArtists, topSongs) => {
  if (email !== '' && password !== '') {
      createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            const { uid, email } = cred.user;    

            addDoc(collection(database, 'users'), {
              _id: uid,
              email: email,
              matches: [], // contains emails
              swiped_right: [], // contains emails
              createdAt: (new Date()).getTime(),
              notifications: [],
              notifications_length: 0,
              picture: profile.images.length === 0 ? "" : profile.images[0].url,
              top_artists: topArtists.map((artist) => {
                return {
                  name: artist.name,
                  picture: artist.images[0].url,
                  spotify: artist.external_urls.spotify
                }
              }),
              top_songs: topSongs.map((song) => {
                return {
                  name: song.name,
                  picture: song.album.images[0].url,
                  spotify: song.uri
                }
              }),
              display_name: profile.display_name
            });

            console.log('Signup success')
        })
        .catch((err) => Alert.alert("Login error", err.message));
  }
};
  
  return (
    <View style={styles.container}>
      <Image source={backImage} style={styles.backImage} />
      <View style={styles.whiteSheet} />
      <SafeAreaView style={styles.form}>
        <Text style={styles.title}>FUSIC</Text>
        <TouchableOpacity style={styles.button} onPress={onHandleLogin}>
            <Text style={styles.loginText}>
              Log In With Spotify
            </Text>
        </TouchableOpacity>
      </SafeAreaView>
      <StatusBar barStyle="light-content" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: "orange",
    alignSelf: "center",
    paddingBottom: 24,
  },
  input: {
    backgroundColor: "#F6F7FB",
    height: 58,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 10,
    padding: 12,
  },
  backImage: {
    width: "100%",
    height: 340,
    position: "absolute",
    top: 0,
    resizeMode: 'cover',
  },
  whiteSheet: {
    width: '100%',
    height: '75%',
    position: "absolute",
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 60,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 30,
  },
  button: {
    backgroundColor: '#f57c00',
    height: 58,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loginText :{
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 18
  }
});