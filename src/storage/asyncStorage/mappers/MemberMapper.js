/* eslint-disable no-underscore-dangle */

import { convertUserToStorable } from './UserMapper';
import { getChannelMembersKey } from '../keys';

export const convertMembersToStorable = (
  members,
  channelId,
  storable,
  appUserId,
) => {
  const _members = members ? Object.values(members) : [];
  const storableMembers = _members.map((m) =>
    convertMemberToStorable(m, storable, appUserId),
  );

  storable[getChannelMembersKey(appUserId, channelId)] = storableMembers;

  return getChannelMembersKey(appUserId, channelId);
};

export const convertMemberToStorable = (m, storable, appUserId) => {
  const member = {
    created_at: m.created_at,
    invite_accepted_at: m.invite_accepted_at,
    invite_rejected_at: m.invite_rejected_at,
    invited: m.invited,
    is_moderator: m.is_moderator,
    role: m.role,
    updated_at: m.updated_at,
    user: convertUserToStorable(m.user_id, m.user, storable, appUserId),
    user_id: m.user_id,
  };

  return member;
};
