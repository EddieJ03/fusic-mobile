import { View, TouchableOpacity, Text, StyleSheet, Image, Modal, ActivityIndicator } from "react-native";
import React, { useEffect, useLayoutEffect, useState, useContext } from "react";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import ModalContentLinks from "../components/ModalContentLinks";
import TinderCardContent from "../components/TinderCardContent";
import { Entypo, AntDesign } from '@expo/vector-icons';
import { AuthenticatedUserContext } from '../Context';  
import { signOut, deleteUser } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import TinderCard from 'react-tinder-card';
import colors from '../colors';
import {
    collection,
    orderBy,
    query,
    onSnapshot,
    getDocs,
    where,
    limit,
    doc,
    updateDoc,
    getDoc,
    deleteDoc 
} from 'firebase/firestore';

const spotify = require("../assets/Spotify_Logo_RGB_Green.png");

const Home = () => {
    const { user, setUser, prevScreen, setPrevScreen } = useContext(AuthenticatedUserContext);

    const [modalText, setModalText] = useState("");
    const [profiles, setProfiles] = useState([]);
    const [length, setLength] = useState(0);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // 0 is match, 1 is delete, 2 is links
    const [modalState, setModalState] = useState(0);

    const navigation = useNavigation();
    const isFocused = useIsFocused();

    useEffect(() => {
        if(isFocused) {
            updateNotifications();
        }
    }, [isFocused])

    useLayoutEffect(() => {
        if(user) {
            getProfiles();
            console.log("entered home");

            const collectionRef = collection(database, 'users');
            const q = query(collectionRef, where('email', '==', user.email));

            const unsubscribe = onSnapshot(q, querySnapshot => {
                console.log('usersnapshot unsusbscribe');
                const userInfo = querySnapshot.docs[0].data();
                setUser(
                    {
                        id: user.id,
                        ...userInfo
                    }
                );
            });
            
            return () => unsubscribe();
        }
    }, []);

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
                    onPress={() => {
                        setModalText('Delete Account?');
                        setVisible(true);
                        setModalState(1);
                    }}
                >
                    <Entypo name="trash" size={24} color={colors.gray} style={{marginRight: 10}} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate("Notifications")}
                >
                    <Entypo name="bell" size={24} color={user.notifications_length > 0 ? colors.primary : colors.gray} style={{marginRight: 10}} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate("ChatList")}
                >
                    <Entypo name="chat" size={24} color={user.matches.find(element => element.lastToSend !== "" && element.lastToSend !== user.email) !== undefined ? colors.primary : colors.gray} style={{marginRight: 10}} />
                </TouchableOpacity>
            </View>
          )
        });
    }, [navigation, user]);

    const swiped = async (direction, profile) => {
      setLength(length - 1);

      if(direction === 'right') {
        const profileRef = doc(database, 'users', profile.id);
        const profileSnap = await getDoc(profileRef);

        if(!profileSnap.exists()) {
            return;
        }

        if(profileSnap.data().swiped_right.includes(user.email)) {
            setModalState(0);
            setModalText("You matched with " + profile.email + "!");
            setVisible(true);
            console.log('hit match');
            const userToUpdate = doc(database, 'users', user.id);
            const otherToUpdate = doc(database, 'users', profile.id);

            await updateDoc(userToUpdate, {
                matches: [{email: profile.email, lastToSend: "", id: profile.id, picture: profile.picture, display_name: profile.display_name}, ...user.matches]
            })

            // filter out swiped_right in other user
            await updateDoc(otherToUpdate, {
                 matches: [{email: user.email, lastToSend: "", id: user.id, picture: user.picture, display_name: user.display_name}, ...profileSnap.data().matches],
                 swiped_right: profile.swiped_right.filter(email => email !== user.email),
                 notifications: [`New Friend: ${user.email}!`, ...profile.notifications],
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
    };
  
    const onSignOut = () => {
        signOut(auth).catch(error => console.log('Error logging out: ', error));
    };

    const getProfiles = async () => {
        console.log("running get profiles");
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

        const filteredProfiles = profilesQuerySnapshot.docs.filter((profile) => !alreadySwiped.has(profile.data().email)).map((profile) => {
            const { email, swiped_right, notifications, notifications_length, picture, top_artists, top_songs, display_name } = profile.data();

            return {
                id: profile.id,
                email,
                swiped_right,
                notifications,
                notifications_length,
                picture,
                top_artists,
                top_songs,
                display_name
            };
        });

        setProfiles(filteredProfiles);
        setLength(filteredProfiles.length);
        setLoading(false);
    };

    const updateNotifications = async () => {
        console.log(prevScreen + " in home");

        if(prevScreen === "Notifications" && user.notifications_length > 0) {
            const dataToUpdate = doc(database, 'users', user.id);
            await updateDoc(dataToUpdate, {
                notifications_length: 0,
            });
        }
        
        setPrevScreen("Home");
    };

    const deleteAccount = async () => {
        setLoading(true);
        setVisible(false);

        // remove messages
        const collectionRef = collection(database, 'chats');
        
        for(let i = 0; i < user.matches.length; i++) {
            let other = user.matches[i];
            const messageQuery = query(collectionRef, where('userFromAndTo', 'in', [user.email+","+other.email, other.email+","+user.email]));

            const messageQueryData = await getDocs(messageQuery);

            // delete each message
            const messages = messageQueryData.docs;

            for(let i = 0; i < messages.length; i++) {
                await deleteDoc(doc(database, 'chats', messages[i].id));
            }

            const matchRef = doc(database, 'users', user.matches[i].id);

            const profileSnap = await getDoc(matchRef);

            const otherMatches = profileSnap.data().matches;

            await updateDoc(matchRef, {
                matches: otherMatches.filter(u => u.email !== user.email)
            });
        }

        const { id } = user;

        setUser(null);

        // delete the user
        await deleteDoc(doc(database, 'users', id));

        await deleteUser(auth.currentUser);

        onSignOut();
    };

    const displayLinks = () => {
        setVisible(true);
        setModalState(2);
        setModalText("Links");
    };

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
                    {
                        modalState === 2 
                        ?
                        <>
                            <ModalContentLinks profiles={profiles} length={length} />
                        </>
                        :
                        <>
                        </>
                    }
                    {
                        modalState === 1
                        ?
                        <View style={{flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                            <TouchableOpacity
                                onPress={() => {
                                    if(modalText === "Delete Account?") {
                                        setModalText("Are you sure you want to delete?");
                                    } else {
                                        deleteAccount();
                                    }
                                }}
                                style={styles.modalButton}
                            >
                                <Text style={{color: 'white'}}>YES</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setVisible(!visible)}
                                style={{...styles.modalButton, backgroundColor: colors.primary, marginLeft: 5}}
                            >
                                <Text style={{color: 'white'}}>NO</Text>
                            </TouchableOpacity>
                        </View>
                        :
                        <TouchableOpacity
                            onPress={() => setVisible(!visible)}
                            style={styles.modalButton}
                        >
                            <Text style={{color: 'white'}}>OK</Text>
                        </TouchableOpacity>
                    }
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
                        length > 0 
                        ?
                            <>
                            <TouchableOpacity onPress={displayLinks} style={styles.linksButton}>
                                <Image style={{width: 100, height: 30}} source={spotify} />
                            </TouchableOpacity>
                            {
                                profiles.map(profile => 
                                    <TinderCard key={profile.email} onSwipe={(dir) => swiped(dir, profile)} preventSwipe={['down', 'up']}>
                                        <TinderCardContent profile={profile} />
                                    </TinderCard>
                                )
                            }
                            </>
                        :
                        <>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <TouchableOpacity
                                    onPress={getProfiles}
                                    style={styles.getProfiles}
                                >
                                    <Text style={{color: 'white', textAlign: 'center'}}>Get More Profiles</Text>
                                </TouchableOpacity>
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
    linksButton: {
        width: 120, 
        height: 35, 
        backgroundColor: 'white', 
        left: 15, 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
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
        maxHeight: 600,
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
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontWeight: 'bold',
        fontSize: 30
    },
    rightIcons: {
        display: 'flex',
        flexDirection: 'row',
    },
    noProfilePic: {
        backgroundColor: 'black', 
        height: 100, 
        width: 100, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 50,
        position: 'absolute',
        top: -40
    },
    modalButton: {
        backgroundColor: colors.gray, 
        height: 30, 
        width: 60, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 10
    },
    getProfiles:{
        backgroundColor: colors.primary, 
        height: 50, 
        width: 100, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center', 
        borderRadius: 15
    }
});