import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useCallback,
    useContext
  } from 'react';
  import { View, FlatList, Text, StyleSheet } from 'react-native';
  import { GiftedChat } from 'react-native-gifted-chat';
  import {
    collection,
    addDoc,
    orderBy,
    query,
    onSnapshot,
    doc,
    where,
    updateDoc,
    getDoc 
  } from 'firebase/firestore';
  import { signOut } from 'firebase/auth';
  import { auth, database } from '../config/firebase';
  import { useNavigation } from '@react-navigation/native';
  import { AntDesign } from '@expo/vector-icons';
  import colors from '../colors';
  import { AuthenticatedUserContext } from '../Context'


export default function Chat({ route }) {
    const { user } = useContext(AuthenticatedUserContext);
    const { other } = route.params;

    const [messages, setMessages] = useState([]);
    const navigation = useNavigation();

    useLayoutEffect(() => {
        const collectionRef = collection(database, 'chats');
        const q = query(collectionRef, where('userFromAndTo', 'in', [user.email+","+other.email, other.email+","+user.email]), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, querySnapshot => {
            console.log('querySnapshot unsusbscribe');
            setMessages(
                querySnapshot.docs.map(doc => ({
                    _id: doc.data()._id,
                    createdAt: doc.data().createdAt.toDate(),
                    text: doc.data().text,
                    userFromAndTo: doc.data().userFromAndTo,
                    user: doc.data().user
                }))
            );
        });

        return unsubscribe;
    }, []);

    const onSend = useCallback(async (messages = []) => {
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, messages)
        );

        // setMessages([...messages, ...messages]);
        const { _id, createdAt, text } = messages[0];    
        addDoc(collection(database, 'chats'), {
          _id,
          createdAt,
          text,
          userFromAndTo: user.email+","+other.email,
          user: messages[0].user
        });

        // update lastToSend in respective matches array
        const userToUpdate = doc(database, 'users', user.id);
        const otherToUpdate = doc(database, 'users', other.id);

        const otherSnap = await getDoc(otherToUpdate);

        const otherMatches = otherSnap.data().matches;

        user.matches[user.matches.findIndex(x => x.email === other.email)].lastToSend = user.email;
        otherMatches[otherMatches.findIndex(x => x.email === user.email)].lastToSend = user.email;

        await updateDoc(userToUpdate, {
            matches: user.matches
        })

        await updateDoc(otherToUpdate, {
          matches: otherMatches
        })
    }, []);

      return (
        <GiftedChat
          messages={messages}
          showAvatarForEveryMessage={false}
          showUserAvatar={false}
          onSend={messages => onSend(messages)}
          messagesContainerStyle={{
            backgroundColor: '#fff'
          }}
          textInputStyle={{
            backgroundColor: '#fff',
            borderRadius: 20,
          }}
          user={{
            _id: auth?.currentUser?.email,
            avatar: 'https://i.pravatar.cc/300'
          }}
        />
    );
}