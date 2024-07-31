package models

type Player struct {
    Username string
    Character byte
    Fields []int
    RoomId string
}

type Room struct {
    Player1 *Player
    Player2 *Player
    Turn byte
    RoomId string
}
