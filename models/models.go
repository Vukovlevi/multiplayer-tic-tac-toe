package models

type Player struct {
    username string
    character byte
    fields []int
}

type Room struct {
    player1 *Player
    player2 *Player
    turn byte
}
