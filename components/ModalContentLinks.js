import { View, TouchableOpacity, Text, StyleSheet, Image, Linking } from "react-native";
import colors from '../colors';
import React from "react";

function ModalContentLinks({ profiles, length }) {

    const openLink = async (url) => {
        await Linking.openURL(url);
    }

    return (
        <>
            <Text style={styles.title}>
                TOP ARTISTS
            </Text>
            <View style={{display: 'flex', flexDirection: 'row'}}>
                {
                    profiles[length-1].top_artists.length > 0 ? profiles[length-1].top_artists.map(
                        artist => 
                        <View key={artist.name} style={styles.artists}>
                            <Image style={styles.picture} source={{uri: artist.picture}}/>
                            <TouchableOpacity onPress={() => openLink(artist.spotify)} style={styles.link}>
                                <Text style={{alignSelf: 'center', color: 'white'}}>
                                    {artist.name}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) 
                    : 
                    <View style={styles.empty}>
                        <Text>No top artists . . .</Text>
                    </View>
                }
            </View>
            <Text style={styles.title}>
                TOP SONGS
            </Text>
            <View style={{display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 10}}>
                {
                    profiles[length-1].top_songs.length > 0 ?  profiles[length-1].top_songs.map(
                        song => 
                        <View key={song.name} style={styles.artists}>
                            <Image style={styles.picture} source={{uri: song.picture}}/>
                            <TouchableOpacity onPress={() => openLink(song.spotify)} style={styles.link}>
                                <Text style={{alignSelf: 'center', color: 'white'}}>
                                    {song.name}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) 
                    : 
                    <View style={styles.empty}>
                        <Text>No top songs . . .</Text>
                    </View>                                                
                }
            </View>
        </>
    )
}

export default ModalContentLinks;

const styles = StyleSheet.create({
    title: {
        fontWeight: 'bold', 
        marginTop: 20, 
        marginBottom: 10
    },
    link: {
        width: 90, 
        height: 20, 
        backgroundColor: 
        colors.primary, 
        borderRadius: 15, 
        marginTop: 5
    },
    empty: {
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
});