import React, {
    useLayoutEffect,
    useContext
} from 'react';
import { View, FlatList, Text, StyleSheet, Image } from 'react-native';
import {
    collection,
    query,
    onSnapshot,
    where 
} from 'firebase/firestore';
import { database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { AuthenticatedUserContext } from '../Context'


export default function Notifications() {
    const { user, setUser, setPrevScreen } = useContext(AuthenticatedUserContext);
    
    const navigation = useNavigation();

    useLayoutEffect(() => {
        const collectionRef = collection(database, 'users');
        const q = query(collectionRef, where('email', '==', user.email));

        const unsubscribe = onSnapshot(q, querySnapshot => {
            console.log('notifications unsusbscribe');
            setUser(
                {
                    ...user,
                    ...querySnapshot.docs[0].data()
                }
            );
        });

        setPrevScreen("Notifications");
        
        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                data={user.notifications}
                renderItem={
                    ({item, index}) => (
                        <View style={styles.item}>
                            <Image
                                style={styles.tinyLogo}
                                source={{
                                    uri: 'https://i.pravatar.cc/300',
                                }}
                            />
                            <Text style={styles.name}>
                                {item} {index >= user.notifications_length ? "" : " + NEW MATCH"}
                            </Text>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    name: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
    tinyLogo: {
        width: 40,
        height: 40,
        borderRadius: 50
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
    }
});