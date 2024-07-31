package storage

import (
	"sync"

	"github.com/vukovlevi/multiplayer-tic-tac-toe/models"
)

type GameStore struct {
    games map[string]*models.Room
    mutex sync.RWMutex
}

type PlayerStore struct {
    players map[string]*models.Player
    mutex sync.RWMutex
}

var gameStore GameStore
var playerStore PlayerStore

func InitializeStores() {
    gameStore = GameStore{
        games: make(map[string]*models.Room),
        mutex: sync.RWMutex{},
    }

    playerStore = PlayerStore{
        players: make(map[string]*models.Player),
        mutex: sync.RWMutex{},
    }
}

func AddPlayer(player *models.Player) bool {
    playerStore.mutex.Lock()
    defer playerStore.mutex.Unlock()
    _, ok := playerStore.players[player.Username]
    return !ok
}

func AddGame(room *models.Room) {
    gameStore.mutex.Lock()
    defer gameStore.mutex.Unlock()
    gameStore.games[room.RoomId] = room
}

func GetPlayer(username string) *models.Player {
    return playerStore.players[username]
}

func GetGame(roomId string) *models.Room {
    return gameStore.games[roomId]
}
