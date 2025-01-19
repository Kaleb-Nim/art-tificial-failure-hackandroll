export type UserType = {
  user_id: string;
  name: string;
  created_at: string;
  character_img: string;
};

export type UserRoomType = {
  room_id: string;
  user_id: string;
  score: number;
  is_active: boolean;
  created_at: string;
  art_users: UserType;
};

export type RoomType = {
  room_id: string;
  host_id: string;
  round_duration: number;
  created_at: string;
  is_active: boolean;
};

export type RoundType = {
  id: number;
  room_id: string;
  topic_id: number;
  drawer_id: string;
  created_at: string;
  winner: string;
};
