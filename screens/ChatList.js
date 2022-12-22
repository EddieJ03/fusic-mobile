import React, {
    useLayoutEffect,
    useContext
} from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
    collection,
    query,
    onSnapshot,
    where 
} from 'firebase/firestore';
import { database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { AuthenticatedUserContext } from '../Context';
import colors from '../colors';
import { Ionicons } from '@expo/vector-icons';


export default function ChatList() {
    const { user, setUser } = useContext(AuthenticatedUserContext);

    const navigation = useNavigation();

    useLayoutEffect(() => {
        const collectionRef = collection(database, 'users');
        const q = query(collectionRef, where('email', '==', user.email));

        const unsubscribe = onSnapshot(q, querySnapshot => {
            console.log('chatlist unsusbscribe');
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
                data={user.matches}
                renderItem={
                    ({item}) => (
                        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                            <TouchableOpacity onPress={() => navigation.navigate("Chat", {other: item})} style={styles.item}>
                                {
                                    item.picture === "" 
                                    ?
                                    <View style={styles.noProfilePic} >
                                        <Ionicons size={20} name="person" color="white" />
                                    </View>
                                    :
                                    <Image
                                        style={styles.tinyLogo}
                                        source={{
                                            uri: item.picture,
                                        }}
                                    />
                                }
                                <Text style={styles.name}>
                                    {item.email} 
                                </Text>
                            </TouchableOpacity>
                            {
                                item.lastToSend === "" || item.lastToSend === user.email 
                                ? <></> 
                                : 
                                <View style={{height: 15, width: 15, borderRadius: 50, backgroundColor: colors.primary, marginRight: 20}}></View>
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
    noProfilePic: {
        backgroundColor: 'black', 
        height: 40, 
        width: 40, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 50,
    }
});