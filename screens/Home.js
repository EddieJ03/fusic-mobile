import React, { useEffect, useLayoutEffect, useState, useContext } from "react";
import { View, TouchableOpacity, Text, Image, StyleSheet, ImageBackground, Modal, Pressable, ActivityIndicator } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import colors from '../colors';
import { Entypo, AntDesign } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import TinderCard from 'react-tinder-card';
const backImage = require("../assets/backImage.png");
import { AuthenticatedUserContext } from '../Context';  
import {
    collection,
    addDoc,
    orderBy,
    query,
    onSnapshot,
    getDocs,
    where,
    limit,
    doc,
    updateDoc,
    getDoc
} from 'firebase/firestore';

const Home = () => {
    const { user, setUser, prevScreen, setPrevScreen } = useContext(AuthenticatedUserContext);

    const [visible, setVisible] = useState(false);
    const [modalText, setModalText] = useState("");
    const [loading, setLoading] = useState(false);

    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        if(isFocused) {
            updateNotifications();
            getProfiles();
            setPrevScreen("Home");
        }
    }, [isFocused])

    useLayoutEffect(() => {
        console.log("entered home");

        const collectionRef = collection(database, 'users');
        const q = query(collectionRef, where('email', '==', user.email));

        const unsubscribe = onSnapshot(q, querySnapshot => {
            console.log('usersnapshot unsusbscribe');
            setUser(
                {
                    id: user.id,
                    ...querySnapshot.docs[0].data()
                }
            );
        });
        
        return () => unsubscribe();
    }, []);

    const swiped = async (direction, profile) => {
      if(direction === 'right') {
        const profileRef = doc(database, 'users', profile.id);
        const profileSnap = await getDoc(profileRef);

        if(profileSnap.data().swiped_right.includes(user.email)) {
            setModalText("You matched with " + profile.email + "!");
            setVisible(true);
            console.log('hit match');
            const userToUpdate = doc(database, 'users', user.id);
            const otherToUpdate = doc(database, 'users', profile.id);

            await updateDoc(userToUpdate, {
                matches: [{email: profile.email, lastToSend: "", id: profile.id}, ...user.matches]
            })

            // filter out swiped_right in other user
            await updateDoc(otherToUpdate, {
                 matches: [{email: user.email, lastToSend: "", id: user.id}, ...profileSnap.data().matches],
                 swiped_right: profile.swiped_right.filter(email => email !== user.email),
                 notifications: [`You matched with ${user.email}`, ...profile.notifications],
                 notifications_length: profile.notifications_length + 1
            })
        } else {
            console.log('no match');

            // add to swiped_right for current user
            const dataToUpdate = doc(database, 'users', user.id);
            await updateDoc(dataToUpdate, {
                swiped_right: [profile.email, ...user.swiped_right]
            })
        }
      }
    }
  
    const onSignOut = () => {
        signOut(auth).catch(error => console.log('Error logging out: ', error));
    };

    useLayoutEffect(() => {
        navigation.setOptions({
          headerLeft: () => (
            <TouchableOpacity
              style={{
                marginLeft: 10
              }}
              onPress={onSignOut}
            >
              <AntDesign name="leftcircle" size={24} color={'crimson'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.rightIcons}>
                <TouchableOpacity
                    onPress={() => navigation.navigate("Notifications")}
                >
                    <Entypo name="bell" size={24} color={user.notifications_length > 0 ? colors.primary : colors.gray} style={{marginRight: 10}}/>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate("ChatList")}
                >
                    <Entypo name="chat" size={24} color={user.matches.find(element => element.lastToSend !== "" && element.lastToSend !== user.email) !== undefined ? colors.primary : colors.gray} style={{marginRight: 10}}/>
                </TouchableOpacity>
            </View>
          )
        });
    }, [navigation, user]);

    const getProfiles = async () => {
        setLoading(true);
        const collectionRef = collection(database, 'users'); 

        // show more recently created profiles at top
        const profilesQuery = query(collectionRef, where('email', '!=', user.email), orderBy("email"), orderBy('createdAt', 'desc'), limit(100)); 

        const profilesQuerySnapshot = await getDocs(profilesQuery);

        const alreadySwiped = new Set();

        for(let i = 0; i < user.matches.length; i++) {
            alreadySwiped.add(user.matches[i].email);
        }

        for(let i = 0; i < user.swiped_right.length; i++) {
            alreadySwiped.add(user.swiped_right[i]);
        }

        setProfiles(profilesQuerySnapshot.docs.filter((profile) => !alreadySwiped.has(profile.data().email)).map((profile) => {
            const { email, swiped_right, notifications, notifications_length } = profile.data();

            return {
                id: profile.id,
                email,
                swiped_right,
                notifications,
                notifications_length
            };
        }));

        setLoading(false);
    }

    const updateNotifications = async () => {
        // first get rid of notifications if came from notifications
        if(prevScreen === "Notifications" && user.notifications_length > 0) {
            const dataToUpdate = doc(database, 'users', user.id);
            await updateDoc(dataToUpdate, {
                notifications_length: 0,
            });
        }
    }

    return (
        <View style={styles.container}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={() => {
                setVisible(!visible);
                }}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>{modalText}</Text>
                    <Pressable
                        onPress={() => setVisible(!visible)}
                    >
                        <Text>Ok</Text>
                    </Pressable>
                </View>
            </Modal>
            <View style={styles.cardContainer}>
                {
                    loading 
                    ? 
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size='large' />
                    </View>
                    :
                    (
                        profiles.length > 0 ?
                        profiles.map(profile => 
                            <TinderCard key={profile.email} onSwipe={(dir) => swiped(dir, profile)} preventSwipe={['down', 'up']}>
                                <View style={styles.card}>
                                    <ImageBackground style={styles.cardImage} source={backImage}>
                                        <Text style={styles.cardTitle}>
                                            {profile.email}
                                        </Text>
                                    </ImageBackground>
                                </View>
                            </TinderCard>
                        )
                        :
                        <>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Pressable
                                    onPress={getProfiles}
                                    style={{backgroundColor: 'blue', height: 50, width: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 15}}
                                >
                                    <Text style={{color: 'white', textAlign: 'center'}}>Get More Profiles</Text>
                                </Pressable>
                            </View>
                        </>
                    )
                }
            </View>
        </View>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
    },
    signOutButton: {
        backgroundColor: 'crimson',
        height: 50,
        width: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: .9,
        shadowRadius: 8,
        marginRight: 20,
        marginBottom: 50,
    },
    cardContainer: {
        width: '100%',
        height: '100%',
        maxWidth: 350,
        maxHeight: 650,
    },
    card: {
        position: 'absolute',
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 350,
        height: 650,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        borderRadius: 20,
        resizeMode: 'cover',
    },
    cardImage: {
        width: '100%',
        height: '95%',
        overflow: 'hidden',
        borderRadius: 20,
    },
    cardTitle: {
        position: 'absolute',
        bottom: 0,
        margin: 10,
        color: 'black',
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    },
    rightIcons: {
        display: 'flex',
        flexDirection: 'row',
    }
});