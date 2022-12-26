import { GiftedChat } from 'react-native-gifted-chat';
import { AuthenticatedUserContext } from '../Context';
import { database } from '../config/firebase';
import React, {
    useState,
    useLayoutEffect,
    useCallback,
    useContext
} from 'react';
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


export default function Chat({ route }) {
    const { user } = useContext(AuthenticatedUserContext);
    const { other } = route.params;

    const [messages, setMessages] = useState([]);
    

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

        let otherMatches = (await getDoc(otherToUpdate)).data().matches;
        let userMatches = user.matches;

        const userIdx = userMatches.findIndex(x => x.email === other.email);
        const otherIdx = otherMatches.findIndex(x => x.email === user.email);

        userMatches[userIdx].lastToSend = user.email;
        otherMatches[otherIdx].lastToSend = user.email;

        userMatches = [userMatches[userIdx], ...userMatches.slice(0, userIdx), ...userMatches.slice(userIdx+1)];
        otherMatches = [otherMatches[otherIdx], ...otherMatches.slice(0, otherIdx), ...otherMatches.slice(otherIdx+1)];

        await updateDoc(userToUpdate, {
            matches: userMatches
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
            _id: user.email,
            avatar: user.picture === "" ? 'https://i.stack.imgur.com/34AD2.jpg' : user.picture
          }}
        />
    );
}