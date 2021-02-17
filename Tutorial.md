## Setup

First of all we need to setup our new project, make sure you have Android Studio or XCode installed, you will need this to run the mobile app on a device or phone simulator. To keep things as simple as possible we are going to use [Expo](https://expo.io/).

Make sure that
- you have a recent version of [Node (10+)](https://nodejs.org/en/) installed. If you are not sure, just type this in your terminal `node --version`
- you have setup the environment for react-native as mentioned here - https://reactnative.dev/docs/environment-setup

To make it easier for you to follow tutorial, we have setup a repository with all the setup necessary to get you started. So lets start by cloning the repository:

```sh
git clone https://github.com/GetStream/react-native-chat-tutorial.git
cd react-native-chat-tutorial
npx pod-install
```

To get all the [chat functionality](/chat/#key-features-for-chat) in this tutorial, you will need to [get a free 4 weeks trial of Chat](/chat/trial/). No credit card is required.

## Add Stream Chat to your application

Stream Chat comes with fully functional UI components and makes it very simple to add chat to your mobile app. Let’s start by adding a simple conversation chat screen.

Open App.js in your text editor of choice and make the following changes:

<img align="right" src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/tutorial/screenshots/tutorial/step1.png" alt="IMAGE ALT TEXT HERE" width="280" border="1" style="float: right;" />

```jsx
import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {StreamChat} from 'stream-chat';
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider as ChatOverlayProvider,
} from 'stream-chat-react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';

const user = {
  id: 'ron',
};

const chatClient = StreamChat.getInstance('q95x9hkbyd6p');
const connectUserPromise = chatClient.connectUser(user, userToken);

const channel = chatClient.channel('messaging', 'channel_id');

const ChannelScreen = () => {
  const {bottom} = useSafeAreaInsets();

  return (
    <ChatOverlayProvider bottomInset={bottom} topInset={0}>
      <SafeAreaView>
        <Chat client={chatClient}>
          {/* Setting keyboardVerticalOffset as 0, since we don't have any header yet */}
          <Channel channel={channel} keyboardVerticalOffset={0}>
            <View style={{flex: 1}}>
              <MessageList />
              <MessageInput />
            </View>
          </Channel>
        </Chat>
      </SafeAreaView>
    </ChatOverlayProvider>
  );
};

export default function App() {
  const [ready, setReady] = useState();

  useEffect(() => {
    const initChat = async () => {
      await connectUserPromise;
      setReady(true);
    };

    initChat();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ChannelScreen channel={channel} />
    </SafeAreaProvider>
  );
}
```

With this code we know have a fully working chat mobile app running. The `Chat` component is responsible of handling API calls and keep a consistent shared state across all other children components.


```bash
react-native run-ios
```

This will start the React Native development server, you can leave it running, it will live reload your application when you make code changes.

Chat UI React Native components come with batteries included:

## Rich Messaging

The built-in `MessageList` and `MessageInput` components provide several rich interactions out of the box

<div>
  <img src="https://getstream.io/static/ea97596c2edaa240fa0d2819f758b378/045fd/url-preview.png" alt="IMAGE ALT TEXT HERE" width="280" border="1"/>
</div>
**URL previews** Try copy/paste https://goo.gl/Hok8hp in a message.

<div>
  <img src="https://getstream.io/static/ea97596c2edaa240fa0d2819f758b378/045fd/url-preview.png" alt="IMAGE ALT TEXT HERE" width="280" border="1"/>
</div>

**User mentions** Built-in user mention and autocomplete in all your chat channels

<div>
  <img src="https://getstream.io/static/ea97596c2edaa240fa0d2819f758b378/045fd/url-preview.png" alt="IMAGE ALT TEXT HERE" width="280" border="1"/>
</div>

**Chat commands** Built-in chat commands like /giphy and custom commands allow you to create rich user experiences.

<div>
  <img src="https://getstream.io/static/ea97596c2edaa240fa0d2819f758b378/045fd/url-preview.png" alt="IMAGE ALT TEXT HERE" width="280" border="1"/>
</div>

**Image uploads** Upload images directly from your Camera Roll.

## Multiple conversations

Most chat applications handle more than just one single conversation. Apps like Facebook Messenger, Whatsapp and Telegram allows you to have multiple one to one and group conversations.

Let’s find out how we can change our application chat screen to display the list of conversations and navigate between them.

First of all we need to add some basic navigation to our mobile app. We want to list all conversations and be able to go from one to another. Stacked navigation can handle this very well and is supported by the awesome react-navigation package that we installed earlier on.

In order to keep things easy to follow we are going to have all code App.js

```jsx
/* eslint-disable react/display-name */
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {LogBox, SafeAreaView, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator, useHeaderHeight} from '@react-navigation/stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {StreamChat} from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  useAttachmentPickerContext,
} from 'stream-chat-react-native';

LogBox.ignoreAllLogs(true);

const chatClient = StreamChat.getInstance('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};

const filters = {
  example: 'example-apps',
  members: {$in: ['ron']},
  type: 'messaging',
};

const sort = {last_message_at: -1};

const ChannelListScreen = ({navigation}) => {
  const {setChannel} = useContext(AppContext);

  const memoizedFilters = useMemo(() => filters, []);

  return (
    <Chat client={chatClient}>
      <View style={{height: '100%'}}>
        <ChannelList
          filters={memoizedFilters}
          onSelect={(channel) => {
            setChannel(channel);
            navigation.navigate('Channel');
          }}
          sort={sort}
        />
      </View>
    </Chat>
  );
};

const ChannelScreen = ({navigation}) => {
  const {channel, setThread, thread} = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const {setTopInset} = useAttachmentPickerContext();

  useEffect(() => {
    setTopInset(headerHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerHeight]);

  return (
    <SafeAreaView>
      <Chat client={chatClient}>
        <Channel
          channel={channel}
          keyboardVerticalOffset={headerHeight}
          thread={thread}>
          <View style={{flex: 1}}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                navigation.navigate('Thread');
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
};

const Stack = createStackNavigator();

const AppContext = React.createContext();

const App = () => {
  const {bottom} = useSafeAreaInsets();

  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer>
      <AppContext.Provider value={{channel, setChannel, setThread, thread}}>
        <OverlayProvider bottomInset={bottom}>
          {clientReady && (
            <Stack.Navigator
              initialRouteName="ChannelList"
              screenOptions={{
                headerTitleStyle: {alignSelf: 'center', fontWeight: 'bold'},
              }}>
              <Stack.Screen
                component={ChannelScreen}
                name="Channel"
                options={() => ({
                  headerBackTitle: 'Back',
                  headerRight: () => <></>,
                  headerTitle: channel?.data?.name,
                })}
              />
              <Stack.Screen
                component={ChannelListScreen}
                name="ChannelList"
                options={{headerTitle: 'Channel List'}}
              />
            </Stack.Navigator>
          )}
        </OverlayProvider>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

export default () => {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};
```

If you run your application now, you will see the first chat screen now shows a list of conversations, you can open each by tapping and go back to the list.

The `ChannelList` component retrieves the list of channels based on a custom query and ordering. In this case we are showing the list of channels the current user is a member and we order them based on the time they had a new message. ChannelList handles pagination and updates automatically out of the box when new channels are created or when a new message is added to a channel.

> Note: you can also specify more complex queries to match your use cases. The filter prop accepts a MongoDB-like query.

## Customize channel preview

Let’s see how we can change the channel preview of the ChannelList. We are going to add a small badge showing the count of unread messages for each channel.

The React Native Chat SDK library allows you to swap components easily without adding much boiler code. This also works when you have to change deeply nested components like the `ChannelPreview` or `Message`.

```jsx
/* eslint-disable react/display-name */
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  LogBox,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator, useHeaderHeight} from '@react-navigation/stack';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {StreamChat} from 'stream-chat';
import {
  Channel,
  ChannelAvatar,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  useAttachmentPickerContext,
} from 'stream-chat-react-native';

LogBox.ignoreAllLogs(true);

const styles = StyleSheet.create({
  previewContainer: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomColor: '#EBEBEB',
    borderBottomWidth: 1,
    padding: 10,
  },
  previewTitle: {
    textAlignVertical: 'center',
  },
});

const chatClient = StreamChat.getInstance('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};

const filters = {
  example: 'example-apps',
  members: {$in: ['ron']},
  type: 'messaging',
};

const sort = {last_message_at: -1};

const CustomChannelPreview = ({channel, setActiveChannel}) => {
  return (
    <TouchableOpacity
      style={styles.previewContainer}
      onPress={() => {
        setActiveChannel(channel);
      }}>
      <ChannelAvatar channel={channel} />
      <Text style={styles.previewTitle}>{channel.data.name}</Text>
    </TouchableOpacity>
  );
};

const ChannelListScreen = ({navigation}) => {
  const {setChannel} = useContext(AppContext);

  const memoizedFilters = useMemo(() => filters, []);

  return (
    <Chat client={chatClient}>
      <View style={StyleSheet.absoluteFill}>
        <ChannelList
          filters={memoizedFilters}
          onSelect={(channel) => {
            setChannel(channel);
            navigation.navigate('Channel');
          }}
          Preview={CustomChannelPreview}
          sort={sort}
        />
      </View>
    </Chat>
  );
};

const ChannelScreen = ({navigation}) => {
  const {channel, setThread, thread} = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const {setTopInset} = useAttachmentPickerContext();

  useEffect(() => {
    setTopInset(headerHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerHeight]);

  return (
    <SafeAreaView>
      <Chat client={chatClient}>
        <Channel
          channel={channel}
          keyboardVerticalOffset={headerHeight}
          thread={thread}>
          <View style={StyleSheet.absoluteFill}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                navigation.navigate('Thread');
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
};

const Stack = createStackNavigator();
const AppContext = React.createContext();

const App = () => {
  const {bottom} = useSafeAreaInsets();

  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer>
      <AppContext.Provider value={{channel, setChannel, setThread, thread}}>
        <OverlayProvider bottomInset={bottom}>
          {clientReady && (
            <Stack.Navigator
              initialRouteName="ChannelList"
              screenOptions={{
                headerTitleStyle: {alignSelf: 'center', fontWeight: 'bold'},
              }}>
              <Stack.Screen
                component={ChannelScreen}
                name="Channel"
                options={() => ({
                  headerBackTitle: 'Back',
                  headerRight: () => <></>,
                  headerTitle: channel?.data?.name,
                })}
              />
              <Stack.Screen
                component={ChannelListScreen}
                name="ChannelList"
                options={{headerTitle: 'Channel List'}}
              />
            </Stack.Navigator>
          )}
        </OverlayProvider>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

export default () => {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};
```

## Message Threads

Stream Chat supports message threads out of the box. Threads allows users to create sub-conversations inside the same channel.

Using threaded conversations is very simple and mostly a matter of plugging the `Thread` component with React Navigation.

We created a new chat screen component called `ThreadScreen`

We registered the new chat screen to navigation

We pass the `onThreadSelect` prop to `MessageList` and use that to navigate to `ThreadScreen`.

Now we can open threads and create new ones as well, if you long press a message you can tap on Reply and it will open the same `ThreadScreen`.

```jsx
import React, { useContext, useEffect, useState } from 'react';
import { LogBox, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, useHeaderHeight } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';
import { StreamChat } from 'stream-chat';
import { Channel, ChannelList, ChannelPreviewMessenger, Chat, MessageInput, MessageList, Streami18n, Thread } from 'stream-chat-expo';

LogBox.ignoreAllLogs(true);
enableScreens();

const chatClient = StreamChat.getInstance('YOUR_API_KEY');
const userToken = 'USER_TOKEN';

const user = {
  id: 'USER_ID',
  name: 'USER_NAME',
  image: 'https://getstream.io/random_png/?id=USER_ID&amp;name=USER_NAME',
};

const filters = {
  members: { $in: [user.id] },
  type: 'messaging',
};

const sort = { last_message_at: -1 };
const options = {
  state: true,
  watch: true,
};

/**
 * Start playing with streami18n instance here:
 * Please refer to description of this PR for details: https://github.com/GetStream/stream-chat-react-native/pull/150
 */
const streami18n = new Streami18n({
  language: 'en',
});

const ChannelListScreen = React.memo(({ navigation }) => {
  const { setChannel } = useContext(AppContext);
  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <View style={{ height: '100%', padding: 10 }}>
          <ChannelList
            filters={filters}
            onSelect={(channel) => {
              setChannel(channel);
              navigation.navigate('Channel');
            }}
            options={options}
            Preview={ChannelPreviewMessenger}
            sort={sort}
          />
        </View>
      </Chat>
    </SafeAreaView>
  );
});

const ChannelScreen = React.memo(({ navigation }) => {
  const { channel, setThread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <Channel channel={channel} keyboardVerticalOffset={headerHeight}>
          <View style={{ flex: 1 }}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                navigation.navigate('Thread', { channelId: channel.id });
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const ThreadScreen = React.memo(({ route }) => {
  const { thread } = useContext(AppContext);
  const [channel] = useState(chatClient.channel('messaging', route.params.channelId));
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <Channel channel={channel} keyboardVerticalOffset={headerHeight} thread={thread}>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-start',
            }}
          >
            <Thread thread={thread} />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

const Stack = createStackNavigator();

const AppContext = React.createContext();

export default () => {
  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer>
      <AppContext.Provider value={{ channel, setChannel, setThread, thread }}>
        {clientReady && (
          <Stack.Navigator
            initialRouteName='ChannelList'
            screenOptions={{
              cardStyle: { backgroundColor: 'white' },
              headerTitleStyle: { alignSelf: 'center', fontWeight: 'bold' },
            }}
          >
            <Stack.Screen
              component={ChannelScreen}
              name='Channel'
              options={() => ({
                headerBackTitle: 'Back',
                headerRight: () => <></>,
                headerTitle: channel.data.name,
              })}
            />
            <Stack.Screen component={ChannelListScreen} name='ChannelList' options={{ headerTitle: 'Channel List' }} />
            <Stack.Screen
              component={ThreadScreen}
              name='Thread'
              options={({ navigation }) => ({
                headerLeft: () => <></>,
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.goBack();
                    }}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 20,
                    }}
                  >
                    <View
                      style={{
                        alignItems: 'center',
                        backgroundColor: 'white',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: 3,
                        borderStyle: 'solid',
                        borderWidth: 1,
                        height: 30,
                        justifyContent: 'center',
                        width: 30,
                      }}
                    >
                      <Text>X</Text>
                    </View>
                  </TouchableOpacity>
                ),
              })}
            />
          </Stack.Navigator>
        )}
      </AppContext.Provider>
    </NavigationContainer>
  );
};
```

## Custom message

Customizing how messages are rendered is another very common use-case that the SDK supports easily.

Replace the built-in message component with your own is done by passing it as a prop to one of the parent components (eg. `Channel`, `ChannelList`, `MessageList`).

Let’s make a very simple custom message component that uses a more compact layout for messages.

```jsx
import React from 'react';
import { View, SafeAreaView, Text } from 'react-native';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, MessageList, MessageInput, MessageTextContainer } from 'stream-chat-expo';

const chatClient = StreamChat.getInstance('YOUR_API_KEY');
const userToken = 'USER_TOKEN';

const user = {
  id: 'USER_ID',
  name: 'USER_NAME',
  image: 'https://getstream.io/random_png/?id=USER_ID&amp;name=USER_NAME',
};

chatClient.connectUser(user, userToken);
const channel = chatClient.channel('messaging', 'USER_ID');

const CustomMessage = ({ message }) => {
  return (
    <View>
      <Text style={{ alignSelf: 'flex-end' }}>{message.user.name}:</Text>
      <MessageTextContainer message={message} />
    </View>
  );
};
const ChannelScreen = React.memo(({ navigation }) => {
  return (
    <SafeAreaView>
      <Chat client={chatClient}>
        {/* Setting keyboardVerticalOffset as 0, since we don't have any header yet */}
        <Channel channel={channel} keyboardVerticalOffset={0}>
          <View style={{ flex: 1 }}>
            <MessageList Message={CustomMessage} />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

export default function App() {
  return <ChannelScreen />;
}
```

Please checkout react-native [cookbook](<https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-(2.x.x)#how-to-customize-message-component>) for many more examples of message customizations.

## Custom styles

Sometimes all you want to do is just make a few styling adjustments without rewriting entire components. React Native does not have anything like CSS or SCSS available but you are not completely out of luck :)

React Native SDK library uses styled-components and themes to simplify making style changes. Standard it uses the default theme that comes with the components but you can override specific parts of it.

Let’s look at two common use cases: overriding some theme-like styling and make a style change to a component deeply nested in the hierarchy.

### Green theme

If you want to make a global style update like updating colors of your avatars, links etc, you can update the theme’s colors. You can do this really easily like this:

```jsx
const theme = {
  colors: {
    primary: 'green',
  },
};
<Chat style={theme}>// the rest of your app</Chat>;
```

This small theme change updates all the places where the primary color is used. Under the hood it uses the ThemeProvider component provided by styled-components and a buildTheme function that’s included with the library. This function merges your overrides with the default theme, you only need to provide the style changes/additions that you want to make.

### Avatar icon Shape

What if we want to also change the shape of avatars. By default avatars use a circular mask, let’s change that into a square with rounded corners:

```jsx
const theme = {
  'avatar.image': 'border-radius: 6px',
  colors: {
    primary: 'green',
  },
};
<Chat style={theme}>// the rest of your app</Chat>;
```

If we go back to the code from step one and add our simple additions to the theme, our code would look like this:

```jsx
import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, MessageList, MessageInput } from 'stream-chat-expo';

const chatClient = StreamChat.getInstance('YOUR_API_KEY');
const userToken = 'USER_TOKEN';

const theme = {
  'avatar.image': 'border-radius: 6px',
  colors: {
    primary: 'green',
  },
};

const user = {
  id: 'USER_ID',
  name: 'USER_NAME',
  image: 'https://getstream.io/random_png/?id=USER_ID&amp;name=USER_NAME',
};

chatClient.connectUser(user, userToken);
const channel = chatClient.channel('messaging', 'USER_ID');

const ChannelScreen = React.memo(({ navigation }) => {
  return (
    <SafeAreaView>
      <Chat client={chatClient} style={theme}>
        {/* Setting keyboardVerticalOffset as 0, since we don't have any header yet */}
        <Channel channel={channel} keyboardVerticalOffset={0}>
          <View style={{ flex: 1 }}>
            <MessageList />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </SafeAreaView>
  );
});

export default function App() {
  return <ChannelScreen />;
}
```

### Customizing a single component

Let's say you want to change just the style of the avatar inside the message component and not everywhere else. You can do that the same way we're setting the theme on `<Chat />`. If you want to change just the avatar inside the message component all you need to do is:

```jsx
<Message
  message={data.message}
  readBy={readBy}
  groupStyles={['bottom']}
  editing={false}
  style={{ 'avatar.fallback': 'background-color: red;' }}
  {...data.channelContext}
/>
```
