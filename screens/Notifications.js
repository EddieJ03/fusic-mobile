import { View, FlatList, Text, StyleSheet, } from 'react-native';
import { AuthenticatedUserContext } from '../Context';
import { database } from '../config/firebase';
import colors from '../colors';
import React, {
    useLayoutEffect,
    useContext,
} from 'react';
import {
    collection,
    query,
    onSnapshot,
    where 
} from 'firebase/firestore';


export default function Notifications() {
    const { user, setUser, setPrevScreen } = useContext(AuthenticatedUserContext);

    useLayoutEffect(() => {
        setPrevScreen('Notifications');

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
        
        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                data={user.notifications}
                renderItem={
                    ({item, index}) => (
                        <View style={styles.notification}>
                            <View style={styles.item}>
                                <Text style={styles.name}>
                                    {item} 
                                </Text>
                            </View>
                            {
                                index >= user.notifications_length 
                                ? 
                                <></> 
                                : 
                                <View style={styles.notificationIcon}></View>
                            }
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
    },
    notificationIcon: {
        height: 15, 
        width: 15, 
        borderRadius: 50, 
        backgroundColor: colors.primary, 
        marginRight: 20
    },
    notification: {
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center'
    }
});