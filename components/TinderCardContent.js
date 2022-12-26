import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import colors from '../colors';
import { Ionicons } from '@expo/vector-icons';

function TinderCardContent({ profile }) {
  return (
    <View style={styles.card}>
        <View style={styles.cardContents}>
            {
                profile.picture === "" ?
                <View style={styles.noProfilePic} >
                    <Ionicons name="person" size={75} color="white" />
                </View>
                :
                <Image style={styles.noProfilePic} source={{uri: profile.picture}}/>
            }
            <Text style={{fontSize: 25, fontWeight: 'bold'}}>
                {profile.display_name}
            </Text>
            <Text style={{fontWeight: 'bold', marginTop: 20, marginBottom: 10}}>
                TOP ARTISTS
            </Text>
            <View style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                {
                    profile.top_artists.length > 0 ? profile.top_artists.map(
                        artist => 
                        <View key={artist.name} style={styles.artists}>
                            <Image style={styles.picture} source={{uri: artist.picture}}/>
                            <Text style={{alignSelf: 'center'}}>
                                {artist.name}
                            </Text>
                        </View>
                    ) : 
                    <View style={styles.artists}>
                        <Text>No top artists . . .</Text>
                    </View>
                }
            </View>
            <Text style={{fontWeight: 'bold', marginTop: 20, marginBottom: 10}}>
                TOP SONGS
            </Text>
            <View style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                {
                    profile.top_songs.length > 0 ? profile.top_songs.map(
                        song => 
                        <View key={song.name} style={styles.artists}>
                            <Image style={styles.picture} source={{uri: song.picture}}/>
                            <Text style={{alignSelf: 'center'}}>
                                {song.name}
                            </Text>
                        </View>
                    ) : 
                    <View style={styles.artists}>
                        <Text>No top songs . . .</Text>
                    </View>                                                
                }
            </View>
        </View>
    </View>
  )
}

export default TinderCardContent;

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: 350,
        height: 600,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        borderRadius: 20,
        resizeMode: 'cover',
    },
    cardContents: {
        backgroundColor: colors.primary, 
        height: '90%', 
        position: "absolute", 
        bottom: 0,
        width: '100%',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    artists: {
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flex: 1
    },
    picture: {
        width: 100, 
        height: 100,
        objectFit: 'cover',
        borderRadius: 50
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
});