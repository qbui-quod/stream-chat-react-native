import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatListProps,
  FlatList as FlatListType,
  Platform,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';

import {
  isMessagesWithStylesAndReadBy,
  MessageType,
  useMessageList,
} from './hooks/useMessageList';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';

import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  ImageGalleryContextValue,
  useImageGalleryContext,
} from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../contexts/threadContext/ThreadContext';
import {
  ThemeProvider,
  useTheme,
} from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { Channel as StreamChannel } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
  },
  flex: { flex: 1 },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  messagePadding: {
    paddingHorizontal: 8,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
  },
});

const keyExtractor = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  item: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
) =>
  item.id ||
  (item.created_at
    ? typeof item.created_at === 'string'
      ? item.created_at
      : item.created_at.toISOString()
    : Date.now().toString());

type MessageListPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'selectedPicker' | 'setSelectedPicker'
> &
  Pick<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'channel'
    | 'disabled'
    | 'EmptyStateIndicator'
    | 'loadChannelAtMessage'
    | 'loading'
    | 'LoadingIndicator'
    | 'markRead'
    | 'NetworkDownIndicator'
    | 'reloadChannel'
    | 'scrollToFirstUnreadThreshold'
    | 'setTargetedMessage'
    | 'StickyHeader'
    | 'targetedMessage'
    | 'typingEventsEnabled'
  > &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client' | 'isOnline'> &
  Pick<ImageGalleryContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'setImages'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'initialScrollToFirstUnreadMessage'
    | 'InlineUnreadIndicator'
    | 'loadingMoreRecent'
    | 'loadMore'
    | 'loadMoreRecent'
    | 'Message'
    | 'ScrollToBottomButton'
    | 'MessageSystem'
    | 'myMessageTheme'
    | 'TypingIndicator'
    | 'TypingIndicatorContainer'
  > &
  Pick<
    ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'loadMoreThread' | 'thread'
  > &
  Pick<TranslationContextValue, 't' | 'tDateTimeParser'> & {
    /**
     * Besides existing (default) UX behavior of underlying FlatList of MessageList component, if you want
     * to attach some additional props to underlying FlatList, you can add it to following prop.
     *
     * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
     *
     * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
     *
     * e.g.
     * ```js
     * <MessageList
     *  additionalFlatListProps={{ bounces: true, keyboardDismissMode: true }} />
     * ```
     */
    additionalFlatListProps?: Partial<
      FlatListProps<MessageType<At, Ch, Co, Ev, Me, Re, Us>>
    >;
    /**
     * UI component for footer of message list. By default message list doesn't have any footer.
     * This is a [ListHeaderComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header by default if inverted is true or defaulted
     *
     */
    FooterComponent?: React.ReactElement;
    /**
     * UI component for header of message list. By default message list doesn't have any header.
     * This is a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header if inverted is false
     *
     */
    HeaderComponent?: React.ReactElement;
    /** Whether or not the FlatList is inverted. Defaults to true */
    inverted?: boolean;
    /** Turn off grouping of messages by user */
    noGroupByUser?: boolean;
    onListScroll?: ScrollViewProps['onScroll'];
    /**
     * Handler to open the thread on message. This is callback for touch event for replies button.
     *
     * @param message A message object to open the thread upon.
     */
    onThreadSelect?: (
      message: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread'],
    ) => void;
    /**
     * Use `setFlatListRef` to get access to ref to inner FlatList.
     *
     * e.g.
     * ```js
     * <MessageList
     *  setFlatListRef={(ref) => {
     *    // Use ref for your own good
     *  }}
     * ```
     */
    setFlatListRef?: (
      ref: FlatListType<MessageType<At, Ch, Co, Ev, Me, Re, Us>> | null,
    ) => void;
    /**
     * Boolean whether or not the Messages in the MessageList are part of a Thread
     **/
    threadList?: boolean;
  };

/**
 * The message list component renders a list of messages. It consumes the following contexts:
 *
 * [ChannelContext](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * [ChatContext](https://getstream.github.io/stream-chat-react-native/#chatcontext)
 * [MessagesContext](https://getstream.github.io/stream-chat-react-native/#messagescontext)
 * [ThreadContext](https://getstream.github.io/stream-chat-react-native/#threadcontext)
 * [TranslationContext](https://getstream.github.io/stream-chat-react-native/#translationcontext)
 */
const MessageListWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalFlatListProps,
    channel,
    client,
    closePicker,
    DateHeader,
    disabled,
    disableTypingIndicator,
    EmptyStateIndicator,
    FlatList,
    FooterComponent,
    HeaderComponent,
    initialScrollToFirstUnreadMessage,
    InlineUnreadIndicator,
    inverted = true,
    isOnline,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    loadingMoreRecent,
    loadMore,
    loadMoreRecent,
    loadMoreThread,
    markRead,
    Message,
    MessageSystem,
    myMessageTheme,
    NetworkDownIndicator,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    reloadChannel,
    ScrollToBottomButton,
    scrollToFirstUnreadThreshold,
    selectedPicker,
    setFlatListRef,
    setImages,
    setSelectedPicker,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    tDateTimeParser,
    thread,
    threadList = false,
    typingEventsEnabled,
    TypingIndicator,
    TypingIndicatorContainer,
  } = props;

  const {
    theme: {
      colors: { accent_blue, white_snow },
      messageList: { container, listContainer },
    },
  } = useTheme();

  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    inverted,
    noGroupByUser,
    threadList,
  });
  const messageListLength = messageList.length;

  const [autoscrollToTopThreshold, setAutoscrollToTopThreshold] = useState(
    channel?.state.isUpToDate ? 10 : undefined,
  );

  const flatListRef = useRef<FlatListType<
    MessageType<At, Ch, Co, Ev, Me, Re, Us>
  > | null>(null);
  const initialScrollSet = useRef<boolean>(false);

  const [hasMoved, setHasMoved] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedMessage(messageList)?.id,
  );
  const [
    scrollToBottomButtonVisible,
    setScrollToBottomButtonVisible,
  ] = useState(false);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date>(new Date());
  const stickyHeaderDateRef = useRef(new Date());

  /**
   * We need topMessage and channelLastRead values to set the initial scroll position.
   * So these values only get used if `initialScrollToFirstUnreadMessage` prop is true.
   */
  const topMessage = useRef<
    MessageType<At, Ch, Co, Ev, Me, Re, Us> | undefined
  >(messageList[messageListLength - 1] || undefined);
  const channelLastRead = useRef(channel?.lastRead());

  const viewableMessages = useRef<string[]>([]);

  const isUnreadMessage = (
    message: MessageType<At, Ch, Co, Ev, Me, Re, Us> | undefined,
    lastRead: ReturnType<StreamChannel<At, Ch, Co, Ev, Me, Re, Us>['lastRead']>,
  ) =>
    message && lastRead && message.created_at && lastRead < message.created_at;

  /**
   * If the top message in the list is unread, then we should scroll to top of the list.
   * This is to handle the case when entire message list is unread.
   * This scroll get set only on load, and never again.
   */
  const setInitialScrollIfNeeded = () => {
    // If the feature is disabled or initial scroll position is already set.
    if (!initialScrollToFirstUnreadMessage || initialScrollSet.current) {
      initialScrollSet.current = true;
      return;
    }

    if (isUnreadMessage(topMessage.current, channelLastRead.current)) {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd();
      }
      setTimeout(() => {
        initialScrollSet.current = true;
      }, 500);
    } else {
      initialScrollSet.current = true;
    }
  };

  /**
   * We keep track of viewableItems, to implement scrollToMessage functionality.
   * We can use scrollToIndex only if the message is within viewable limits.
   */
  const updateViewableMessages = (viewableItems: ViewToken[]) => {
    viewableMessages.current = viewableItems.map(
      (viewableItem) => viewableItem.item.id,
    );
  };

  const updateStickyHeaderDateIfNeeded = (viewableItems: ViewToken[]) => {
    if (viewableItems.length) {
      const lastItem = viewableItems.pop() as {
        item: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
      };

      if (
        lastItem?.item?.created_at &&
        !lastItem.item.deleted_at &&
        typeof lastItem.item.created_at !== 'string' &&
        lastItem.item.created_at.toDateString() !==
          stickyHeaderDateRef.current.toDateString()
      ) {
        stickyHeaderDateRef.current = lastItem.item.created_at;
        setStickyHeaderDate(lastItem.item.created_at);
      }
    }
  };

  /**
   * FlatList doesn't accept changeable function for onViewableItemsChanged prop.
   * Thus useRef.
   */
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] | undefined }) => {
      if (viewableItems) {
        updateViewableMessages(viewableItems);
        updateStickyHeaderDateIfNeeded(viewableItems);
      }
      setInitialScrollIfNeeded();
    },
  );

  useEffect(() => {
    setScrollToBottomButtonVisible(false);
  }, [disabled]);

  useEffect(() => {
    if (channel && channel.countUnread() <= scrollToFirstUnreadThreshold) {
      channel.markRead();
    }
  }, []);

  useEffect(() => {
    /**
     * Scroll to bottom only if:
     * 1. Channel has received a new message AND
     * 2. Message was sent by me (current logged in user)
     */
    const scrollToBottomIfNeeded = () => {
      if (!client || !channel) {
        return;
      }

      const lastReceivedMessage = getLastReceivedMessage(messageList);

      const hasNewMessage = lastReceivedId !== lastReceivedMessage?.id;
      const isMyMessage = lastReceivedMessage?.user?.id === client.userID;

      setLastReceivedId(lastReceivedMessage?.id);

      // Scroll down when it's your own message that you added..
      if (hasNewMessage && isMyMessage) {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: 0 });
        }
        setScrollToBottomButtonVisible(false);
      }
    };

    // If channel is not upto date, then always display scrollToBottom button.
    if (!channel?.state.isUpToDate && !scrollToBottomButtonVisible) {
      setScrollToBottomButtonVisible(true);
    } else if (channel?.state.isUpToDate) {
      scrollToBottomIfNeeded();
    }

    /**
     * channelLastRead and topMessage are only used for setting initial scroll.
     * So lets not set it if `initialScrollToFirstUnreadMessage` prop is false.
     * OR if the scroll is already set.
     */
    if (initialScrollToFirstUnreadMessage && !initialScrollSet.current) {
      channelLastRead.current = channel?.lastRead();
      topMessage.current = messageList[messageListLength - 1];
    }
  }, [messageListLength]);

  useEffect(() => {
    // Lets wait so that list gets rendered, before we update autoscrollToTopThreshold,
    setAutoscrollToTopThreshold(channel?.state.isUpToDate ? 10 : undefined);
  }, [messageListLength]);

  const renderItem = ({
    index,
    item: message,
  }: {
    index: number;
    item: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  }) => {
    if (!channel) return null;

    const lastRead = channel?.lastRead();

    const lastMessage = messageList?.[index + 1];

    const showUnreadUnderlay =
      !!isUnreadMessage(message, lastRead) && scrollToBottomButtonVisible;
    const insertInlineUnreadIndicator =
      showUnreadUnderlay && !isUnreadMessage(lastMessage, lastRead);

    if (message.type === 'system') {
      return (
        <>
          <MessageSystem message={message} style={styles.messagePadding} />
          {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
        </>
      );
    }

    if (message.type !== 'message.read') {
      const wrapMessageInTheme =
        client.userID === message.user?.id && !!myMessageTheme;
      if (wrapMessageInTheme) {
        return (
          <>
            <ThemeProvider style={myMessageTheme}>
              <Message
                goToMessage={goToMessage}
                groupStyles={
                  isMessagesWithStylesAndReadBy(message)
                    ? message.groupStyles
                    : []
                }
                lastReceivedId={
                  lastReceivedId === message.id ? lastReceivedId : undefined
                }
                message={message}
                onThreadSelect={onThreadSelect}
                showUnreadUnderlay={showUnreadUnderlay}
                style={styles.messagePadding}
                targetedMessage={targetedMessage === message.id}
                threadList={threadList}
              />
            </ThemeProvider>
            {/* Adding indicator below the messages, since the list is inverted */}
            {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
          </>
        );
      }
      return (
        <>
          <Message
            goToMessage={goToMessage}
            groupStyles={
              isMessagesWithStylesAndReadBy(message) ? message.groupStyles : []
            }
            lastReceivedId={
              lastReceivedId === message.id ? lastReceivedId : undefined
            }
            message={message}
            onThreadSelect={onThreadSelect}
            showUnreadUnderlay={showUnreadUnderlay}
            style={styles.messagePadding}
            targetedMessage={targetedMessage === message.id}
            threadList={threadList}
          />
          {/* Adding indicator below the messages, since the list is inverted */}
          {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
        </>
      );
    }

    return null;
  };

  /**
   * Following if condition covers following cases:
   * 1. If I scroll up -> show scrollToBottom button.
   * 2. If I scroll to bottom of screen
   *    |-> hide scrollToBottom button.
   *    |-> if channel is unread, call markRead().
   */
  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    if (!channel || !initialScrollSet.current) {
      return;
    }

    const y = event.nativeEvent.contentOffset.y;
    // Show scrollToBottom button once scroll position goes beyond 300.
    const isScrollAtBottom = y <= 300;
    const showScrollToBottomButton =
      !isScrollAtBottom || !channel?.state.isUpToDate;
    const loadMoreRecentResults =
      !loadingMoreRecent && isScrollAtBottom && !channel?.state.isUpToDate;
    const shouldMarkRead =
      !threadList &&
      isScrollAtBottom &&
      channel?.state.isUpToDate &&
      channel.countUnread() > 0;

    if (shouldMarkRead) {
      markRead();
    }

    if (loadMoreRecentResults) {
      loadMoreRecent();
    }

    if (showScrollToBottomButton && !scrollToBottomButtonVisible) {
      setScrollToBottomButtonVisible(true);
    } else if (!showScrollToBottomButton && scrollToBottomButtonVisible) {
      setScrollToBottomButtonVisible(false);
    }

    if (onListScroll) {
      onListScroll(event);
    }
  };

  const goToNewMessages = async () => {
    if (!channel?.state.isUpToDate) {
      await reloadChannel();
    } else if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: 0,
      });
    }

    setScrollToBottomButtonVisible(false);
    if (!threadList) {
      markRead();
    }
  };

  const goToMessage = (messageId: string) => {
    const indexOfParentInViewable = viewableMessages.current.indexOf(messageId);

    if (indexOfParentInViewable > -1) {
      const indexOfParentInMessageList = messageList.findIndex(
        (message) => message?.id === messageId,
      );

      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: indexOfParentInMessageList - 1,
        });
      }

      setTargetedMessage(messageId);
    } else {
      loadChannelAtMessage({ messageId });
    }
  };

  const messagesWithImages = messageList.filter((message) => {
    if (!message.deleted_at && message.attachments) {
      return message.attachments.some(
        (attachment) =>
          attachment.type === 'image' &&
          !attachment.title_link &&
          !attachment.og_scrape_url &&
          (attachment.image_url || attachment.thumb_url),
      );
    }
    return false;
  });

  /**
   * This is for the useEffect to run again in the case that a message
   * gets edited with more or the same number of images
   */
  const imageString = messagesWithImages
    .map((message) =>
      message.attachments
        ?.map(
          (attachment) => attachment.image_url || attachment.thumb_url || '',
        )
        .join(),
    )
    .join();

  const numberOfMessagesWithImages = messagesWithImages.length;
  const threadExists = !!thread;
  useEffect(() => {
    if ((threadList && thread) || (!threadList && !thread)) {
      setImages(messagesWithImages);
    }
  }, [imageString, numberOfMessagesWithImages, threadExists, threadList]);

  const stickyHeaderFormatDate =
    stickyHeaderDate.getFullYear() === new Date().getFullYear()
      ? 'MMM D'
      : 'MMM D, YYYY';
  const tStickyHeaderDate = tDateTimeParser(stickyHeaderDate);
  const stickyHeaderDateToRender = isDayOrMoment(tStickyHeaderDate)
    ? tStickyHeaderDate.format(stickyHeaderFormatDate)
    : new Date(tStickyHeaderDate).toDateString();

  const dismissImagePicker = () => {
    if (!hasMoved && selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    }
  };

  if (!FlatList) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: white_snow }, container]}
    >
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={messageList}
        /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
        extraData={disabled || !channel?.state.isUpToDate}
        inverted={inverted}
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <View style={styles.flex}>
            {loading ? (
              <LoadingIndicator listType='message' />
            ) : (
              <View style={styles.flex} testID='empty-state'>
                <EmptyStateIndicator listType='message' />
              </View>
            )}
          </View>
        }
        ListFooterComponent={FooterComponent}
        // TODO: Scrolling doesn't work perfectly with this loading indicator. Investigate and fix.
        ListHeaderComponent={() =>
          HeaderComponent ? (
            HeaderComponent
          ) : Platform.OS !== 'android' && loadingMoreRecent ? (
            <View style={[styles.activityIndicatorContainer]}>
              <ActivityIndicator color={accent_blue} size='small' />
            </View>
          ) : null
        }
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold,
          minIndexForVisible: 1,
        }}
        onEndReached={threadList ? loadMoreThread : loadMore}
        onScroll={handleScroll}
        onScrollBeginDrag={() => setHasMoved(true)}
        onScrollEndDrag={() => setHasMoved(false)}
        onTouchEnd={dismissImagePicker}
        onViewableItemsChanged={onViewableItemsChanged.current}
        ref={(ref) => {
          flatListRef.current = ref;

          if (setFlatListRef) {
            setFlatListRef(ref);
          }
        }}
        renderItem={renderItem}
        style={[styles.listContainer, listContainer]}
        testID='message-flat-list'
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 50,
        }}
        {...additionalFlatListProps}
      />
      {!loading && (
        <>
          <View style={styles.stickyHeader}>
            {StickyHeader ? (
              <StickyHeader dateString={stickyHeaderDateToRender} />
            ) : messageListLength ? (
              <DateHeader dateString={stickyHeaderDateToRender} />
            ) : null}
          </View>
          {!disableTypingIndicator &&
            TypingIndicator &&
            typingEventsEnabled !== false && (
              <TypingIndicatorContainer>
                <TypingIndicator />
              </TypingIndicatorContainer>
            )}
          <ScrollToBottomButton
            onPress={goToNewMessages}
            showNotification={scrollToBottomButtonVisible}
            unreadCount={channel?.countUnread()}
          />
        </>
      )}
      {!isOnline && <NetworkDownIndicator />}
    </View>
  );
};

export type MessageListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<MessageListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    closePicker,
    selectedPicker,
    setSelectedPicker,
  } = useAttachmentPickerContext();
  const {
    channel,
    disabled,
    EmptyStateIndicator,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    markRead,
    NetworkDownIndicator,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    typingEventsEnabled,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setImages } = useImageGalleryContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    DateHeader,
    disableTypingIndicator,
    FlatList,
    initialScrollToFirstUnreadMessage,
    InlineUnreadIndicator,
    loadingMoreRecent,
    loadMore,
    loadMoreRecent,
    Message,
    MessageSystem,
    myMessageTheme,
    ScrollToBottomButton,
    TypingIndicator,
    TypingIndicatorContainer,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { loadMoreThread, thread } = useThreadContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t, tDateTimeParser } = useTranslationContext();

  return (
    <MessageListWithContext
      {...{
        channel,
        client,
        closePicker,
        DateHeader,
        disabled,
        disableTypingIndicator,
        EmptyStateIndicator,
        FlatList,
        initialScrollToFirstUnreadMessage,
        InlineUnreadIndicator,
        isOnline,
        loadChannelAtMessage,
        loading,
        LoadingIndicator,
        loadingMoreRecent,
        loadMore,
        loadMoreRecent,
        loadMoreThread,
        markRead,
        Message,
        MessageSystem,
        myMessageTheme,
        NetworkDownIndicator,
        reloadChannel,
        ScrollToBottomButton,
        scrollToFirstUnreadThreshold,
        selectedPicker,
        setImages,
        setSelectedPicker,
        setTargetedMessage,
        StickyHeader,
        t,
        targetedMessage,
        tDateTimeParser,
        thread,
        typingEventsEnabled,
        TypingIndicator,
        TypingIndicatorContainer,
      }}
      {...props}
    />
  );
};
